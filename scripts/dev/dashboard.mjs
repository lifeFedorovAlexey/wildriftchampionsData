import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes, createHmac } from 'node:crypto';
import { ports, origin, runtime, redact } from './config.mjs';
import { databaseStatus } from './database.mjs';
import { storageStatus } from './storage.mjs';

const logNames = ['ui', 'public', 'auth', 'gateway', 'chat', 'tunnel', 'storage-tunnel', 'supervisor'];
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
export async function probe(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(3000), redirect: 'manual' });
    await response.body?.cancel();
    return { ok: response.status < 400, status: response.status };
  } catch { return { ok: false, status: 0 }; }
}

export async function status(config, state) {
  const services = Object.fromEntries(await Promise.all(['public', 'auth', 'gateway', 'chat', 'ui'].map(async name =>
    [name, { url: origin(name), ...await probe(`${origin(name)}${name === 'chat' ? '/health' : name === 'ui' ? '/api/auth/session' : '/api/health'}`) }])));
  let database;
  try { database = await databaseStatus(config); } catch (error) { database = { ok: false, error: redact(error.message, config) }; }
  const storage = await storageStatus(config);
  return { ready: state.ready, healthy: state.ready && database.ok && storage.ok && Object.values(services).every(service => service.ok), startedAt: state.startedAt, services, database, storage, logs: path.join(runtime, 'logs') };
}

async function exchange(config, type, profile) {
  const secret = type === 'admin' ? config.secrets.admin : config.secrets.user;
  const payload = Buffer.from(JSON.stringify({ profile, ts: Date.now(), nonce: randomBytes(16).toString('hex') })).toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  const response = await fetch(`${origin('gateway')}/api/${type}/session/exchange`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payload, signature }), signal: AbortSignal.timeout(10_000),
  });
  const result = await response.json();
  if (!response.ok || !result.sessionToken) throw new Error(`Local ${type} login failed: ${result.error || response.status}`);
  return result.sessionToken;
}

export function createDashboard(config, state, shutdown) {
  const server = http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // The login form redirects to the UI on a different loopback port.
    res.setHeader('Content-Security-Policy', `default-src 'self'; style-src 'unsafe-inline'; frame-ancestors 'none'; form-action 'self' ${origin('ui')}`);
    if (req.headers.host !== `127.0.0.1:${ports.dashboard}`) { res.writeHead(403).end(); return; }
    const url = new URL(req.url, origin('dashboard'));
    try {
      if (req.method === 'POST') {
        if (req.headers.origin && req.headers.origin !== origin('dashboard')) { res.writeHead(403).end(); return; }
        let body = '';
        for await (const part of req) { body += part; if (body.length > 4096) { res.writeHead(413).end(); return; } }
        const form = new URLSearchParams(body);
        if ((req.headers['x-local-token'] || form.get('token')) !== config.secrets.control) { res.writeHead(403).end(); return; }
        if (url.pathname === '/stop') {
          res.end('Stopping local services; database and storage data are retained.');
          setImmediate(() => shutdown(0)); return;
        }
        if (url.pathname !== '/login') { res.writeHead(404).end(); return; }
        const role = form.get('role');
        if (!['admin', 'user', 'guest'].includes(role)) { res.writeHead(400).end(); return; }
        const cookies = ['wr_admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0', 'wr_user_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'];
        if (role !== 'guest') {
          const profile = { provider: 'google', subject: `wildrift-local-${role}`, email: role === 'admin' ? 'developer@wildrift.invalid' : 'player@wildrift.invalid', name: role === 'admin' ? 'Local Developer' : 'Local Player' };
          const cookie = (name, token) => `${name}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=1209600`;
          if (role === 'admin') cookies[0] = cookie('wr_admin_session', await exchange(config, 'admin', profile));
          cookies[1] = cookie('wr_user_session', await exchange(config, 'user', profile));
        }
        res.setHeader('Set-Cookie', cookies);
        res.writeHead(303, { Location: `${origin('ui')}${role === 'admin' ? '/admin' : '/me'}` }).end(); return;
      }
      if (req.method !== 'GET') { res.writeHead(405).end(); return; }
      if (url.pathname === '/ready') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ready: state.ready, startedAt: state.startedAt })); return;
      }
      if (url.pathname === '/status') {
        res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(await status(config, state))); return;
      }
      if (url.pathname === '/logs') {
        const name = url.searchParams.get('service');
        if (!logNames.includes(name)) { res.writeHead(400).end(); return; }
        const file = path.join(runtime, 'logs', `${name}.log`);
        let data = 'No log entries yet.';
        if (fs.existsSync(file)) {
          const fd = fs.openSync(file, 'r');
          try {
            const size = fs.fstatSync(fd).size;
            const buffer = Buffer.alloc(Math.min(size, 65536));
            fs.readSync(fd, buffer, 0, buffer.length, Math.max(0, size - buffer.length)); data = buffer.toString('utf8');
          } finally { fs.closeSync(fd); }
        }
        res.setHeader('Content-Type', 'text/plain; charset=utf-8'); res.end(redact(data, config)); return;
      }
      if (url.pathname !== '/') { res.writeHead(404).end(); return; }
      const info = await status(config, state);
      const form = (role, label) => `<form action="/login" method="post"><input type="hidden" name="token" value="${config.secrets.control}"><input type="hidden" name="role" value="${role}"><button>${label}</button></form>`;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(`<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Wild Rift · локальная разработка</title>
<style>body{background:#10151f;color:#e5edf9;font:16px system-ui;margin:40px auto;padding:0 24px;max-width:1000px}h1{font-size:32px}h2{margin-top:36px}a{color:#8bc9ff}table{border-collapse:collapse;width:100%}td,th{text-align:left;padding:10px;border-bottom:1px solid #334155}small,p{color:#b9c6d8}button{background:#9acbff;border:0;border-radius:8px;padding:12px 18px;cursor:pointer}nav{display:flex;gap:12px;flex-wrap:wrap}code{color:#b6e4c4}summary{cursor:pointer}.ok{color:#8de2a1}.bad{color:#ffadad}</style>
<h1>Wild Rift · локальная разработка</h1><p>${info.healthy ? 'Все сервисы работают' : state.ready ? 'Есть недоступные сервисы — проверь диагностику ниже' : 'Запуск сервисов…'} · <a href="/">Обновить</a> · <a href="/status">JSON-диагностика</a></p>
<nav><a href="${origin('ui')}">Открыть сайт ↗</a><a href="${origin('ui')}/patch-notes">Патчи</a><a href="${origin('ui')}/trends">Тренды</a><a href="${origin('ui')}/me/chat">Чат</a><a href="${origin('ui')}/quizzes">Квизы</a></nav>
<h2>Тестовый вход</h2><p>Аккаунты создаются в wildrift_dev. После входа пользуйся адресами 127.0.0.1: cookies привязаны к этому хосту.</p><nav>${form('admin', 'Войти администратором')}${form('user', 'Войти игроком')}${form('guest', 'Выйти из тестовых аккаунтов')}</nav>
<h2>Сервисы</h2><table><tr><th>Сервис</th><th>Адрес</th><th>Проверка</th><th>Логи</th></tr>${Object.entries(info.services).map(([name, service]) => `<tr><td>${name}</td><td><a href="${service.url}">${service.url}</a></td><td class="${service.ok ? 'ok' : 'bad'}">${service.ok ? 'OK' : 'Недоступен'} (${service.status})</td><td><a href="/logs?service=${name}">Открыть</a></td></tr>`).join('')}</table>
<h2>База данных</h2><p><code>wildrift_app@127.0.0.1:15432/wildrift_dev</code> → SSH kolvrt<br>${info.database.ok ? `Размер: ${escape(info.database.size)} · соединений: ${info.database.connections}` : escape(info.database.error)}</p><p>Пароль для клиента БД: <code>.runtime/dev/database.env</code></p><details><summary>Таблицы и примерное количество строк</summary><table>${(info.database.tables || []).map(t => `<tr><td>${escape(t.name)}</td><td>${t.estimated_rows}</td></tr>`).join('')}</table></details>
<h2>Файлы и логи</h2><p>S3 на kolvrt: <span class="${info.storage.ok ? 'ok' : 'bad'}">${info.storage.ok ? 'Доступно' : 'Недоступно'}</span> · <code>${origin('storage')}/wildrift-dev</code> → SSH → <code>127.0.0.1:8333</code> на сервере. Данные: <code>/srv/data/dev-s3/data</code>. Ключи для S3-клиента: <code>.runtime/dev/storage.env</code>.</p><p><a href="/logs?service=tunnel">SSH PostgreSQL</a> · <a href="/logs?service=storage-tunnel">SSH S3</a> · <a href="/logs?service=supervisor">Общий лог</a> · каталог <code>.runtime/dev/logs</code></p>
<p>Остановка: <code>npm run dev:down</code>. Повторный запуск: <code>npm run dev:up</code>.</p></html>`);
    } catch (error) { res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' }).end(redact(error.message, config)); }
  });
  return server;
}
