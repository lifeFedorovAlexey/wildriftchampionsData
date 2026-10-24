import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import puppeteer from 'puppeteer';
import { root, runtime, readConfig, origin, apiRequire, connectDatabase, verifyDatabase } from './config.mjs';
import { storageClient } from './storage.mjs';

const config = readConfig();
const json = async (url, init = {}) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000), ...init });
  const payload = await response.json();
  assert.ok(response.ok, `${url}: ${response.status} ${JSON.stringify(payload).slice(0, 250)}`);
  return payload;
};
assert.equal((await json(`${origin('dashboard')}/status`)).healthy, true);
for (const route of ['/api/champions', '/api/guides', '/api/patch-notes', '/api/latest-stats-snapshot']) {
  await json(origin('gateway') + route); console.log(`[smoke] ${route}: OK`);
}

const login = await fetch(`${origin('dashboard')}/login`, { method: 'POST', redirect: 'manual',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: origin('dashboard') },
  body: new URLSearchParams({ token: config.secrets.control, role: 'admin' }), signal: AbortSignal.timeout(20_000) });
assert.equal(login.status, 303, await login.text());
const cookie = login.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
const headers = { Cookie: cookie };
assert.equal((await json(`${origin('ui')}/api/auth/session`, { headers })).authenticated, true);
console.log('[smoke] Real admin + public-user sessions: OK');

const chat = await json(`${origin('ui')}/api/chat/session`, { headers });
const { WebSocket } = createRequire(path.join(root, 'wr-chat/package.json'))('ws');
await new Promise((resolve, reject) => {
  const socket = new WebSocket(`ws://127.0.0.1:3310/ws?sessionToken=${encodeURIComponent(chat.sessionToken)}`, { origin: origin('ui') });
  const timeout = setTimeout(() => { socket.terminate(); reject(new Error('Chat ready timeout')); }, 10_000);
  socket.once('error', error => { clearTimeout(timeout); reject(error); });
  socket.once('message', message => {
    clearTimeout(timeout); socket.close();
    try { assert.equal(JSON.parse(String(message)).type, 'session:ready'); resolve(); } catch (error) { reject(error); }
  });
});
console.log('[smoke] Authenticated WebSocket handshake: OK');

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5N8AAAAASUVORK5CYII=', 'base64');
const groups = await json(`${origin('ui')}/api/chat/groups`, { headers });
assert.ok(groups.groups?.length, 'A dev chat group must be available after setup');
const channels = await json(`${origin('ui')}/api/chat/channels?groupId=${groups.groups[0].id}`, { headers });
assert.ok(channels.channels?.length, 'A dev chat channel must be available after setup');
const attachment = await json(`${origin('ui')}/api/chat/attachments`, { method: 'POST',
  headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify({ channelId: channels.channels[0].id, fileName: 'dev-smoke.png', mimeType: 'image/png', sizeBytes: png.length }) });
const attachmentUrl = new URL(attachment.upload.url);
assert.equal(attachmentUrl.origin, origin('storage'));
assert.ok(attachmentUrl.pathname.startsWith('/wildrift-dev/chat-media/'));
const attachmentKey = decodeURIComponent(attachmentUrl.pathname.slice('/wildrift-dev/'.length));
const attachmentStorage = storageClient(config);
try {
  const put = await fetch(attachment.upload.url, { method: 'PUT', headers: { ...attachment.upload.headers, Origin: origin('ui') }, body: png, signal: AbortSignal.timeout(15_000) });
  assert.ok(put.ok, `Chat S3 PUT ${put.status}`);
  assert.equal(put.headers.get('access-control-allow-origin'), origin('ui'));
  await put.body?.cancel();
  const publicUrl = `${config.storage.publicBaseUrl}/${attachmentKey}`;
  const { sanitizeChatMediaUrl } = await import('../../ui/lib/chat-media-url.js');
  assert.equal(sanitizeChatMediaUrl(publicUrl, { storageOrigin: origin('storage'), allowLocalStorage: true }), publicUrl);
  const downloaded = await fetch(publicUrl, { signal: AbortSignal.timeout(15_000) });
  assert.equal(downloaded.status, 200);
  assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()), png);
} finally {
  try {
    await attachmentStorage.send(new (apiRequire('@aws-sdk/client-s3').DeleteObjectCommand)({ Bucket: 'wildrift-dev', Key: attachmentKey }));
  } finally {
    attachmentStorage.destroy();
    const sql = connectDatabase(config);
    try {
      await verifyDatabase(sql);
      await sql`delete from chat_message_attachments where id = ${attachment.attachment.id} and object_key = ${attachmentKey} and message_id is null and status = 'pending'`;
    } finally { await sql.end(); }
  }
}
console.log('[smoke] Chat attachment API, signed S3 PUT, CORS, media URL and cleanup: OK');


const upload = await json(`${origin('gateway')}/api/quizzes/media-upload`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ contentType: 'image/png', size: png.length }) });
assert.equal(new URL(upload.uploadUrl).origin, origin('storage'));
const form = new FormData();
for (const [key, value] of Object.entries(upload.uploadFields)) form.append(key, value);
form.append('file', new Blob([png], { type: 'image/png' }), 'smoke.png');
const posted = await fetch(upload.uploadUrl, { method: 'POST', headers: { Origin: origin('ui') }, body: form });
assert.ok(posted.ok, `S3 POST ${posted.status}: ${await posted.text()}`);
assert.equal(posted.headers.get('access-control-allow-origin'), origin('ui'));
const downloaded = await fetch(upload.url);
assert.equal(downloaded.status, 200);
assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()), png);
const storage = storageClient(config);
try { await storage.send(new (apiRequire('@aws-sdk/client-s3').DeleteObjectCommand)({ Bucket: 'wildrift-dev', Key: upload.key })); }
finally { storage.destroy(); }
console.log('[smoke] Signed S3 POST, CORS, public read and cleanup: OK');

const anonymousListing = await fetch(`${origin('storage')}/wildrift-dev?list-type=2`);
assert.equal(anonymousListing.status, 403, 'Anonymous bucket listing must be denied');
await anonymousListing.body?.cancel();
const deniedKey = `smoke/anonymous-denied-${Date.now()}.txt`;
const anonymousWrite = await fetch(`${origin('storage')}/wildrift-dev/${deniedKey}`, { method: 'PUT', body: 'local-dev-security-probe' });
if (anonymousWrite.ok) {
  const cleanup = storageClient(config);
  try { await cleanup.send(new (apiRequire('@aws-sdk/client-s3').DeleteObjectCommand)({ Bucket: 'wildrift-dev', Key: deniedKey })); }
  finally { cleanup.destroy(); }
}
assert.equal(anonymousWrite.status, 403, 'Anonymous writes must be denied');
await anonymousWrite.body?.cancel();
const scopedStorage = storageClient(config);
try {
  await assert.rejects(scopedStorage.send(new (apiRequire('@aws-sdk/client-s3').HeadBucketCommand)({ Bucket: 'wildrift-access-probe' })),
    error => error.$metadata?.httpStatusCode === 403, 'Project credentials must not access other buckets');
} finally { scopedStorage.destroy(); }
console.log('[smoke] S3 denies anonymous listing/writes and access outside the dev bucket: OK');

const routes = ['/', '/trends', '/patch-notes', '/guides', '/me', '/me/chat', '/quizzes', '/admin'];
for (const route of routes) {
  const response = await fetch(origin('ui') + route, { headers, signal: AbortSignal.timeout(90_000) });
  assert.equal(response.status, 200, route);
  const html = await response.text();
  assert.ok(html.includes('<html'), `Missing HTML on ${route}`);
  console.log(`[smoke] UI ${route}: OK`);
}

if (process.argv.includes('--browser')) {
const candidates = [await puppeteer.executablePath(), 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'];
const browser = await puppeteer.launch({ executablePath: candidates.find(file => fs.existsSync(file)), headless: true });
const errors = [];
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  page.on('pageerror', error => errors.push(error.message));
  await page.setCookie(...login.headers.getSetCookie().map(value => {
    const [name, token] = value.split(';')[0].split('='); return { name, value: token, url: origin('ui'), httpOnly: true, sameSite: 'Lax' };
  }));
  for (const route of routes) {
    const response = await page.goto(origin('ui') + route, { waitUntil: 'networkidle2', timeout: 90_000 });
    assert.equal(response.status(), 200, route);
    await page.waitForSelector('body');
    assert.equal(await page.evaluate(() => document.querySelectorAll('nextjs-portal [data-nextjs-dialog]').length), 0, `Next error overlay on ${route}`);
    console.log(`[smoke] Browser ${route}: OK`);
  }
  await page.goto(origin('ui') + '/patch-notes', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(runtime, 'smoke-desktop.png'), fullPage: false });
  assert.deepEqual(errors, [], 'Browser JavaScript errors');
} finally { await browser.close(); }
}
fs.writeFileSync(path.join(runtime, 'smoke-report.json'), JSON.stringify({ passed: true, browser: process.argv.includes('--browser'), at: new Date().toISOString() }, null, 2));
console.log('[smoke] All checks passed.');
