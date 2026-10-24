import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import dotenv from 'dotenv';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const runtime = path.join(root, '.runtime/dev');
export const apiRequire = createRequire(path.join(root, 'wr-api/package.json'));
export const ports = Object.freeze({ ui: 3300, public: 3302, auth: 3303, gateway: 3301, chat: 3310, dashboard: 3399, storage: 3390, database: 15432 });
export const origin = (name) => `http://127.0.0.1:${ports[name]}`;

export function assertDevDatabaseUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error('Missing/invalid dev DATABASE_URL. Run npm run dev:setup.'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || url.hostname !== '127.0.0.1' ||
      url.port !== '15432' || url.pathname !== '/wildrift_dev' || url.username !== 'wildrift_app' ||
      !url.password || url.search || url.hash) {
    throw new Error('Refusing database: only wildrift_app@127.0.0.1:15432/wildrift_dev is allowed (no URL options).');
  }
  return url;
}

export function assertDevStorageEnv(env) {
  if (env.S3_ENDPOINT !== origin('storage') || env.S3_BUCKET !== 'wildrift-dev' ||
      env.S3_ACCESS_KEY_ID !== 'wildrift-dev' || !/^[a-f0-9]{64}$/.test(env.S3_SECRET_ACCESS_KEY || '') ||
      env.S3_REGION !== 'us-east-1' || env.S3_FORCE_PATH_STYLE !== 'true' ||
      env.S3_PUBLIC_BASE_URL !== `${origin('storage')}/wildrift-dev`) {
    throw new Error('Refusing S3 configuration: only the kolvrt wildrift-dev bucket through 127.0.0.1:3390 is allowed. Run npm run dev:setup.');
  }
  return { endpoint: env.S3_ENDPOINT, bucket: env.S3_BUCKET, accessKey: env.S3_ACCESS_KEY_ID,
    secretKey: env.S3_SECRET_ACCESS_KEY, region: env.S3_REGION, publicBaseUrl: env.S3_PUBLIC_BASE_URL };
}

export function initRuntime() {
  fs.mkdirSync(path.join(runtime, 'logs'), { recursive: true });
  fs.writeFileSync(path.join(runtime, 'empty.env'), '# Intentionally empty. Production env files are not loaded.\n');
  const secretFile = path.join(runtime, 'secrets.json');
  if (!fs.existsSync(secretFile)) {
    const secrets = Object.fromEntries(['admin', 'user', 'chat', 'sync', 'control'].map(key => [key, randomBytes(32).toString('hex')]));
    fs.writeFileSync(secretFile, JSON.stringify(secrets, null, 2), { flag: 'wx', mode: 0o600 });
  }
}

export function readConfig() {
  initRuntime();
  const file = path.join(runtime, 'database.env');
  if (!fs.existsSync(file)) throw new Error('Dev credentials missing. Run npm run dev:setup.');
  const database = dotenv.parse(fs.readFileSync(file)).DATABASE_URL;
  assertDevDatabaseUrl(database);
  const secrets = JSON.parse(fs.readFileSync(path.join(runtime, 'secrets.json'), 'utf8'));
  for (const key of ['admin', 'user', 'chat', 'sync', 'control']) {
    if (!/^[a-f0-9]{64}$/.test(secrets[key] || '')) throw new Error(`Invalid dev secret: ${key}`);
  }
  const storageFile = path.join(runtime, 'storage.env');
  if (!fs.existsSync(storageFile)) throw new Error('Dev S3 credentials missing. Run npm run dev:setup.');
  const storage = assertDevStorageEnv(dotenv.parse(fs.readFileSync(storageFile)));
  return { database, secrets, storage };
}

// Pass OS essentials only. Explicit empty values also shadow Next's .env.local.
export function childEnv(config, parent = process.env) {
  const env = {};
  for (const [key, value] of Object.entries(parent)) {
    if (/^(PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|HOME|USERPROFILE|APPDATA|LOCALAPPDATA|PROGRAMFILES|PROGRAMFILES\(X86\)|PROGRAMDATA|SYSTEMDRIVE|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE|SSH_AUTH_SOCK)$/i.test(key)) env[key] = value;
  }
  for (const dir of ['', 'ui', 'wr-api', 'wr-chat']) {
    if (!fs.existsSync(path.join(root, dir))) continue;
    for (const name of fs.readdirSync(path.join(root, dir)).filter(name => /^\.env(?:\.|$)/.test(name))) {
      const file = path.join(root, dir, name);
      if (fs.statSync(file).isFile()) {
        for (const key of Object.keys(dotenv.parse(fs.readFileSync(file)))) env[key] = '';
      }
    }
  }
  return Object.assign(env, {
    NODE_ENV: 'development', WR_LOCAL_DEV: 'true', HOST: '127.0.0.1',
    DOTENV_CONFIG_PATH: path.join(runtime, 'empty.env'), DOTENV_CONFIG_QUIET: 'true',
    DATABASE_URL: config.database, DATABASE_POOL_MAX: '2',
    ADMIN_SESSION_SECRET: config.secrets.admin, USER_SESSION_SECRET: config.secrets.user,
    WR_CHAT_SHARED_SECRET: config.secrets.chat, GUIDES_SYNC_SECRET: config.secrets.sync,
    CHAMPIONS_SYNC_SECRET: config.secrets.sync, NEWS_SYNC_SECRET: config.secrets.sync,
    ADMIN_BOOTSTRAP_EMAILS: 'developer@wildrift.invalid', USER_AUTH_ENABLED: 'true',
    API_PROXY_TARGET: origin('gateway'), STATS_API_ORIGIN: origin('gateway'),
    API_ORIGIN: origin('gateway'), NEXT_PUBLIC_API_ORIGIN: origin('gateway'),
    NEXT_PUBLIC_STATS_API_ORIGIN: origin('gateway'), NEXT_PUBLIC_API_BASE: '/wr-api',
    WR_API_ORIGIN: origin('gateway'), UPSTREAM_HOST: '127.0.0.1',
    PUBLIC_UPSTREAM_PORT: String(ports.public), AUTH_UPSTREAM_PORT: String(ports.auth),
    WR_CHAT_ORIGIN: origin('chat'), WR_CHAT_PUBLIC_ORIGIN: origin('chat'),
    WR_CHAT_ALLOWED_ORIGINS: origin('ui'), CORS_ALLOWED_ORIGINS: origin('ui'),
    NEXT_PUBLIC_SITE_URL: origin('ui'), ADMIN_PUBLIC_ORIGIN: origin('ui'),
    NEXT_TELEMETRY_DISABLED: '1',
    ASSET_PUBLIC_MODE: 'local', S3_ENDPOINT: config.storage.endpoint, S3_BUCKET: config.storage.bucket,
    S3_REGION: config.storage.region, S3_FORCE_PATH_STYLE: 'true',
    S3_ACCESS_KEY_ID: config.storage.accessKey, S3_SECRET_ACCESS_KEY: config.storage.secretKey,
    S3_PUBLIC_BASE_URL: config.storage.publicBaseUrl,
    QUIZ_MEDIA_ALLOWED_ORIGINS: origin('ui'), CHAT_MEDIA_ALLOWED_ORIGINS: origin('ui'),
    TELEGRAM_BOT_TOKEN: '', ADMIN_TELEGRAM_BOT_TOKEN: '',
  });
}

export function redact(text, config) {
  let value = String(text).replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, '[database URL]');
  for (const secret of [config?.database, config?.storage?.secretKey, ...Object.values(config?.secrets || {})].filter(Boolean)) value = value.split(secret).join('[redacted]');
  return value.replace(/([?&]sessionToken=)[^\s&"']+/gi, '$1[redacted]');
}

export function connectDatabase(config) {
  assertDevDatabaseUrl(config.database);
  const postgres = apiRequire('postgres');
  return postgres(config.database, { max: 1, connect_timeout: 5, idle_timeout: 5, onnotice() {}, connection: { application_name: 'wildrift-local-dev', statement_timeout: '30000', lock_timeout: '5000', idle_in_transaction_session_timeout: '60000' } });
}

export async function verifyDatabase(sql) {
  const [row] = await sql`select current_database() as db, current_user as role, r.rolsuper, r.rolcreatedb, r.rolcreaterole, r.rolreplication, r.rolbypassrls, pg_get_userbyid(d.datdba) as owner from pg_roles r, pg_database d where r.rolname = current_user and d.datname = current_database()`;
  if (row.db !== 'wildrift_dev' || row.role !== 'wildrift_app' || row.owner !== 'wildrift_app' ||
      row.rolsuper || row.rolcreatedb || row.rolcreaterole || row.rolreplication || row.rolbypassrls) {
    throw new Error('Database identity/privilege check failed; refusing to run.');
  }
  return row;
}
