import test from 'node:test';
import assert from 'node:assert/strict';
import { assertDevDatabaseUrl, assertDevStorageEnv, childEnv, redact } from './config.mjs';
import { gameTables } from './database.mjs';
const storageEnv = { S3_ENDPOINT: 'http://127.0.0.1:3390', S3_BUCKET: 'wildrift-dev', S3_ACCESS_KEY_ID: 'wildrift-dev',
  S3_SECRET_ACCESS_KEY: 'a'.repeat(64), S3_REGION: 'us-east-1', S3_FORCE_PATH_STYLE: 'true', S3_PUBLIC_BASE_URL: 'http://127.0.0.1:3390/wildrift-dev' };
const config = { database: 'postgresql://wildrift_app:test-password@127.0.0.1:15432/wildrift_dev', secrets: { admin: 'test-admin-secret', user: 'test-user-secret', chat: 'test-chat-secret', sync: 'test-sync-secret' }, storage: assertDevStorageEnv(storageEnv) };

test('storage guard rejects production endpoints, buckets, admin keys and URL overrides', () => {
  for (const [key, value] of Object.entries({ S3_ENDPOINT: 'https://s3.production.example', S3_BUCKET: 'production',
    S3_ACCESS_KEY_ID: 'dev-s3-admin', S3_SECRET_ACCESS_KEY: '', S3_REGION: 'other', S3_FORCE_PATH_STYLE: 'false',
    S3_PUBLIC_BASE_URL: 'https://cdn.production.example' })) assert.throws(() => assertDevStorageEnv({ ...storageEnv, [key]: value }));
  assert.throws(() => assertDevStorageEnv({ ...storageEnv, S3_ENDPOINT: `${storageEnv.S3_ENDPOINT}?host=production` }));
});

test('database guard rejects production, alternate roles, URL overrides and other local databases', () => {
  assert.doesNotThrow(() => assertDevDatabaseUrl(config.database));
  for (const value of [undefined, '', 'garbage', config.database.replace('127.0.0.1', 'prod.example.com'),
    config.database.replace('15432', '5434'), config.database.replace('wildrift_dev', 'default_db'),
    config.database.replace('wildrift_app', 'postgres'), `${config.database}?host=prod.example.com`,
    `${config.database}#anything`, config.database.replace('postgresql:', 'https:')]) {
    assert.throws(() => assertDevDatabaseUrl(value));
  }
});

test('child environments cannot inherit production credentials, origins or Node preload hooks', () => {
  const env = childEnv(config, { PATH: 'system-path', DATABASE_URL: 'production', NODE_ENV: 'production', NODE_OPTIONS: '--import malicious.mjs', S3_SECRET_ACCESS_KEY: 'prod-key', ADMIN_GOOGLE_CLIENT_SECRET: 'prod-oauth', NEXT_PUBLIC_SITE_URL: 'https://production.example', HTTPS_PROXY: 'https://production.example' });
  assert.equal(env.PATH, 'system-path');
  assert.equal(env.DATABASE_URL, config.database);
  assert.equal(env.NODE_ENV, 'development');
  assert.equal(env.NODE_OPTIONS, undefined);
  assert.equal(env.S3_SECRET_ACCESS_KEY, config.storage.secretKey);
  assert.equal(env.S3_ACCESS_KEY_ID, 'wildrift-dev');
  assert.equal(env.S3_ENDPOINT, 'http://127.0.0.1:3390');
  assert.equal(env.NEXT_PUBLIC_SITE_URL, 'http://127.0.0.1:3300');
  assert.ok(!env.ADMIN_GOOGLE_CLIENT_SECRET);
  assert.equal(env.HTTPS_PROXY, undefined);
  assert.ok(env.DOTENV_CONFIG_PATH.endsWith('empty.env'));
  assert.equal(env.DATABASE_POOL_MAX, '2');
});

test('logs redact connection credentials, dev secrets and chat query tokens', () => {
  const text = redact(`${config.database} ${config.secrets.admin} ${config.storage.secretKey} /ws?sessionToken=private-value&x=1`, config);
  assert.ok(!text.includes('test-password'));
  assert.ok(!text.includes('test-admin-secret'));
  assert.ok(!text.includes('private-value'));
  assert.ok(!text.includes(config.storage.secretKey));
});

test('game data allowlist excludes identities, sessions, messages and user content', () => {
  assert.equal(new Set(gameTables).size, gameTables.length);
  for (const name of gameTables) assert.doesNotMatch(name, /^(admin_|site_|chat_|quiz|webapp_|streamer_)/);
});
