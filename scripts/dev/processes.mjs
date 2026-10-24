import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { spawn, spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline';
import { setTimeout as sleep } from 'node:timers/promises';
import { root, runtime, redact, connectDatabase, verifyDatabase } from './config.mjs';

export async function portIsOpen(port) {
  return await new Promise(resolve => {
    const socket = net.connect({ host: '127.0.0.1', port });
    socket.setTimeout(500);
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('error', () => resolve(false));
    socket.once('timeout', () => { socket.destroy(); resolve(false); });
  });
}

export async function waitFor(check, label, timeout = 60_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await check()) return;
    await sleep(500);
  }
  throw new Error(`Timed out waiting for ${label}. See .runtime/dev/logs.`);
}

export function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, windowsHide: true, stdio: 'inherit', ...options });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`${path.basename(command)} exited with code ${code}`)));
  });
}

export class Processes {
  children = new Map();
  stopping = false;
  constructor(config, onFailure = () => {}) { this.config = config; this.onFailure = onFailure; }
  start(name, command, args, options = {}) {
    const log = path.join(runtime, 'logs', `${name}.log`);
    const write = line => {
      const value = `${new Date().toISOString()} [${name}] ${redact(line, this.config)}\n`;
      if (fs.existsSync(log) && fs.statSync(log).size > 10 * 1024 * 1024) {
        fs.rmSync(`${log}.1`, { force: true }); fs.renameSync(log, `${log}.1`);
      }
      fs.appendFileSync(log, value);
      process.stdout.write(value);
    };
    const child = spawn(command, args, { cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], ...options });
    this.children.set(name, child);
    for (const stream of [child.stdout, child.stderr]) createInterface({ input: stream }).on('line', write);
    child.once('error', error => { write(error.message); if (!this.stopping) this.onFailure(name); });
    child.once('exit', (code, signal) => {
      this.children.delete(name); write(`exited (${code ?? signal})`);
      if (!this.stopping) this.onFailure(name);
    });
    return child;
  }
  async stop() {
    this.stopping = true;
    // Only the child processes spawned by this supervisor, never arbitrary PIDs/ports.
    for (const child of [...this.children.values()].reverse()) {
      if (!child.pid || child.exitCode !== null) continue;
      if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
      else child.kill('SIGTERM');
    }
    this.children.clear();
  }
}

export async function ensureForward(processes, { name, localPort, remotePort }) {
  if (!await portIsOpen(localPort)) {
    const ssh = process.platform === 'win32' ? path.join(process.env.SystemRoot || 'C:/Windows', 'System32/OpenSSH/ssh.exe') : 'ssh';
    processes.start(name, ssh, ['-N', '-C', '-o', 'IPQoS=none', '-o', 'BatchMode=yes', '-o', 'ExitOnForwardFailure=yes',
      '-o', 'ServerAliveInterval=15', '-o', 'ServerAliveCountMax=3', '-L', `127.0.0.1:${localPort}:127.0.0.1:${remotePort}`, 'kolvrt']);
    await waitFor(() => {
      if (!processes.children.has(name)) throw new Error(`SSH tunnel failed. See .runtime/dev/logs/${name}.log.`);
      return portIsOpen(localPort);
    }, `SSH tunnel ${name}`, 20_000);
  }
}

export const ensureStorageTunnel = (_config, processes) => ensureForward(processes,
  { name: 'storage-tunnel', localPort: 3390, remotePort: 8333 });

export async function ensureTunnel(config, processes) {
  await ensureForward(processes, { name: 'tunnel', localPort: 15432, remotePort: 5432 });
  const sql = connectDatabase(config);
  try { await verifyDatabase(sql); } finally { await sql.end(); }
}
