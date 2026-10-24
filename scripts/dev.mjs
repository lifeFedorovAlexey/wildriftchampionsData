import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { root, runtime, ports, origin, readConfig, initRuntime, childEnv, redact } from './dev/config.mjs';
import { Processes, run, waitFor, portIsOpen, ensureTunnel, ensureStorageTunnel } from './dev/processes.mjs';
import { migrate, seedFromOldLocal, databaseStatus } from './dev/database.mjs';
import { createDashboard, probe } from './dev/dashboard.mjs';
import { setupStorage, storageStatus } from './dev/storage.mjs';

const action = process.argv[2] || 'start';
let config;

async function getStatus(detailed = false) {
  try {
    const response = await fetch(`${origin('dashboard')}/${detailed ? 'status' : 'ready'}`, { signal: AbortSignal.timeout(detailed ? 15_000 : 2000) });
    if (!response.ok) return null;
    return await response.json();
  } catch { return null; }
}

async function start() {
  const env = childEnv(config);
  const state = { ready: false, startedAt: new Date().toISOString() };
  let stopping = false;
  const processes = new Processes(config, name => { console.error(`[dev] ${name} stopped unexpectedly.`); void shutdown(1); });
  const server = createDashboard(config, state, shutdown);
  async function shutdown(code) {
    if (stopping) return;
    stopping = true; state.ready = false;
    console.log('[dev] Stopping owned processes; database and storage data are retained.');
    await processes.stop();
    // Keep the control port until all owned children and tunnels have exited.
    server.close(); server.closeAllConnections();
    process.exit(code);
  }
  // Bind the control port before starting anything: a second launcher fails harmlessly.
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(ports.dashboard, '127.0.0.1', resolve); });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => void shutdown(0));
  try {
    for (const name of ['ui', 'public', 'auth', 'gateway', 'chat']) {
      if (await portIsOpen(ports[name])) throw new Error(`Port ${ports[name]} (${name}) is already occupied. No existing process was stopped.`);
    }
    await ensureTunnel(config, processes);
    const db = await databaseStatus(config);
    for (const table of ['champions', 'site_users', 'chat_mutes', 'quizzes', 'patch_notes']) {
      if (!db.tables.some(item => item.name === table)) throw new Error(`Missing ${table}; run npm run dev:setup.`);
    }
    await ensureStorageTunnel(config, processes);
    if (!(await storageStatus(config)).ok) throw new Error('Dev S3 on kolvrt is unavailable or its credentials/bucket do not match. Check port 3390 and run npm run dev:setup.');
    const tsconfig = JSON.parse(fs.readFileSync(path.join(root, 'ui/tsconfig.json'), 'utf8'));
    tsconfig.include = [...tsconfig.include.filter(item => !item.startsWith('.next')), '.next-local/types/**/*.ts', '.next-local/dev/types/**/*.ts'];
    tsconfig.compilerOptions.tsBuildInfoFile = '.next-local/tsconfig.tsbuildinfo';
    fs.writeFileSync(path.join(root, 'ui/.tsconfig.local.json'), JSON.stringify(tsconfig, null, 2) + '\n');
    const instrument = pathToFileURL(path.join(root, 'scripts/dev/instrument.mjs')).href;
    for (const [name, script] of [['public', 'server-public.mjs'], ['auth', 'server-auth.mjs'], ['gateway', 'server-gateway.mjs'], ['chat', 'server.mjs']]) {
      const cwd = path.join(root, name === 'chat' ? 'wr-chat' : 'wr-api');
      processes.start(name, process.execPath, ['--watch', '--import', instrument, script], { cwd, env: { ...env, PORT: String(ports[name]) } });
      await waitFor(async () => (await probe(`${origin(name)}${name === 'chat' ? '/health' : '/api/health'}`)).ok, name);
    }
    processes.start('ui', process.execPath, ['--import', instrument, path.join(root, 'ui/node_modules/next/dist/bin/next'), 'dev', '--hostname', '127.0.0.1', '--port', String(ports.ui)], { cwd: path.join(root, 'ui'), env });
    await waitFor(async () => (await probe(`${origin('ui')}/api/auth/session`)).ok, 'Next.js', 120_000);
    state.ready = true;
    console.log(`\n[dev] Site: ${origin('ui')}\n[dev] Dashboard / test login: ${origin('dashboard')}\n[dev] Stop: Ctrl+C or npm run dev:down\n`);
  } catch (error) { console.error(redact(error.message, config)); await shutdown(1); }
}

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Local development commands cannot run with NODE_ENV=production.');
  if (!['start', 'up', 'down', 'setup', 'seed', 'status', 'logs'].includes(action)) throw new Error('Usage: node scripts/dev.mjs start|up|down|setup|seed|status|logs [service]');
  initRuntime();
  if (action === 'setup' && !fs.existsSync(path.join(runtime, 'database.env'))) {
    console.log('[setup] Reading existing credentials from kolvrt (no sudo/password persistence).');
    await run('scp', ['-q', '-o', 'BatchMode=yes', 'kolvrt:/srv/services/dev-postgres/credentials/wildrift.env', path.join(runtime, 'database.env')]);
  }
  if (action === 'setup' && !fs.existsSync(path.join(runtime, 'storage.env'))) {
    console.log('[setup] Reading existing dev S3 credentials from kolvrt.');
    await run('scp', ['-q', '-o', 'BatchMode=yes', 'kolvrt:/srv/services/dev-s3/credentials/wildrift.env', path.join(runtime, 'storage.env')]);
  }
  config = readConfig();
  if (action === 'setup' || action === 'seed') {
    if (await getStatus()) throw new Error('Stop the local stack with npm run dev:down before setup/seed.');
    const processes = new Processes(config);
    try {
      await ensureTunnel(config, processes);
      if (action === 'setup') {
        await ensureStorageTunnel(config, processes);
        await setupStorage(config);
        await migrate(config, script => run(process.execPath, [path.join(root, 'wr-api/scripts', script)], { cwd: path.join(root, 'wr-api'), env: childEnv(config) }));
        console.log('[setup] Dev database and S3 ready. Optional: npm run dev:seed. Start: npm run dev:up.');
      } else await seedFromOldLocal(config);
    } finally { await processes.stop(); }
    return;
  }
  if (action === 'status') {
    const info = await getStatus(true);
    if (!info) { console.log('Local supervisor is stopped. Start: npm run dev:up'); process.exitCode = 1; return; }
    console.log(JSON.stringify(info, null, 2)); process.exitCode = info.healthy ? 0 : 1; return;
  }
  if (action === 'logs') {
    const name = process.argv[3] || 'supervisor';
    if (!['supervisor', 'ui', 'public', 'auth', 'gateway', 'chat', 'tunnel', 'storage-tunnel'].includes(name)) throw new Error('Unknown service');
    const file = path.join(runtime, 'logs', `${name}.log`);
    console.log(fs.existsSync(file) ? redact(fs.readFileSync(file, 'utf8').split('\n').slice(-150).join('\n'), config) : 'No log entries yet.'); return;
  }
  if (action === 'down') {
    if (!await getStatus()) { console.log('Local supervisor is already stopped.'); return; }
    const response = await fetch(`${origin('dashboard')}/stop`, { method: 'POST', headers: { 'x-local-token': config.secrets.control }, signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error(`Stop failed: ${response.status}`);
    await response.text();
    await waitFor(async () => !await portIsOpen(ports.ui) && !await portIsOpen(ports.dashboard), 'shutdown', 30_000);
    console.log('Local services stopped. All data retained.'); return;
  }
  if (action === 'up') {
    const running = await getStatus();
    if (running?.ready) { console.log(`Already running: ${origin('ui')} · ${origin('dashboard')}`); return; }
    if (running) throw new Error('Supervisor is already starting. Check npm run dev:logs.');
    const file = path.join(runtime, 'logs/supervisor.log');
    if (fs.existsSync(file)) { fs.rmSync(`${file}.1`, { force: true }); fs.renameSync(file, `${file}.1`); }
    const fd = fs.openSync(file, 'a');
    const child = spawn(process.execPath, [path.join(root, 'scripts/dev.mjs'), 'start'], { cwd: root, detached: true, windowsHide: true, stdio: ['ignore', fd, fd] });
    fs.closeSync(fd); child.unref();
    let failure;
    child.once('error', error => { failure = error; });
    child.once('exit', code => { failure = new Error(`Local supervisor exited (${code}). Run npm run dev:logs.`); });
    await waitFor(async () => { if (failure) throw failure; return (await getStatus())?.ready; }, 'local stack', 180_000);
    console.log(`Site: ${origin('ui')}\nDashboard / test login: ${origin('dashboard')}\nStop: npm run dev:down`); return;
  }
  await start();
}

main().catch(error => { console.error(redact(error.message, config)); process.exitCode = 1; });
