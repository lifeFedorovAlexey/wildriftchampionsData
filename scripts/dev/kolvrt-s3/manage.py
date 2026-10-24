#!/usr/bin/env python3
"""Manage only the dev-s3 Compose project on kolvrt; standard library only."""
import argparse
import datetime
import fcntl
import gzip
import json
import os
from pathlib import Path
import pwd
import secrets
import socket
import subprocess
import tarfile

ROOT = Path('/srv/services/dev-s3')
DATA = Path('/srv/data/dev-s3')
MARKER = 'wildrift-kolvrt-dev-s3-v1\n'
PORTS = (8333, 18333, 8888, 18888, 9333, 19333, 9340, 19340)


def run(*args, capture=False):
    return subprocess.run(args, check=True, text=True, capture_output=capture)


def compose(*args, capture=False):
    return run('docker', 'compose', '--project-name', 'dev-s3', '-f',
               str(ROOT / 'compose.yaml'), *args, capture=capture)


def write(path, content, mode=0o600, uid=0, gid=0):
    temporary = path.with_name(path.name + '.tmp')
    with open(temporary, 'x', encoding='utf-8') as out:
        os.chmod(temporary, mode)
        os.chown(temporary, uid, gid)
        out.write(content)
        out.flush()
        os.fsync(out.fileno())
    os.replace(temporary, path)


def owned_directory(path):
    if path.is_symlink():
        raise RuntimeError(f'Refusing symlink: {path}')
    marker = path / '.managed-dev-s3'
    if path.exists() and any(path.iterdir()) and (not marker.is_file() or marker.read_text() != MARKER):
        raise RuntimeError(f'Refusing existing unmanaged directory: {path}')
    path.mkdir(mode=0o700, parents=False, exist_ok=True)
    if not marker.exists():
        write(marker, MARKER)


def install(owner):
    account = pwd.getpwnam(owner)
    if socket.gethostname() != 'kolvrt':
        raise RuntimeError('This installer is restricted to kolvrt.')
    if not (ROOT / 'compose.yaml').exists():
        for port in PORTS:
            with socket.socket() as probe:
                probe.bind(('127.0.0.1', port))
    owned_directory(ROOT)
    owned_directory(DATA)
    os.chmod(ROOT, 0o755)
    os.chmod(DATA, 0o711)
    data_dir = DATA / 'data'
    if not data_dir.exists():
        data_dir.mkdir(mode=0o700)
        os.chown(data_dir, 10001, 10001)
    for name in ('secrets', 'credentials'):
        directory = ROOT / name
        directory.mkdir(mode=0o700, exist_ok=True)
    os.chown(ROOT / 'credentials', 0, account.pw_gid)
    os.chmod(ROOT / 'credentials', 0o750)
    config_path = ROOT / 'secrets/s3.json'
    credentials_path = ROOT / 'credentials/wildrift.env'
    if config_path.exists() != credentials_path.exists():
        raise RuntimeError('Partial credentials found; recover them manually, do not rotate existing keys.')
    if not config_path.exists():
        key = 'wildrift-dev'
        secret = secrets.token_hex(32)
        config = {'identities': [
            {'name': 'dev-s3-admin', 'credentials': [{'accessKey': 'dev-s3-admin', 'secretKey': secrets.token_hex(32)}],
             'actions': ['Admin', 'Read', 'Write', 'List', 'Tagging']},
            {'name': 'wildrift-dev', 'credentials': [{'accessKey': key, 'secretKey': secret}],
             'actions': [f'{action}:wildrift-dev' for action in ('Admin', 'Read', 'Write', 'List', 'Tagging')]},
        ]}
        # Parent directory is root-only; only this file is mounted in the container.
        write(config_path, json.dumps(config, indent=2) + '\n', 0o444)
        write(credentials_path, '\n'.join([
            'S3_ENDPOINT=http://127.0.0.1:3390', 'S3_REGION=us-east-1',
            'S3_BUCKET=wildrift-dev', 'S3_FORCE_PATH_STYLE=true',
            f'S3_ACCESS_KEY_ID={key}', f'S3_SECRET_ACCESS_KEY={secret}',
            'S3_PUBLIC_BASE_URL=http://127.0.0.1:3390/wildrift-dev', '',
        ]), 0o640, 0, account.pw_gid)
    source = Path(__file__).resolve().parent
    for name in ('compose.yaml', 'manage.py', 'README.md'):
        if source != ROOT:
            write(ROOT / name, (source / name).read_text(), 0o644)
    compose('config', '--quiet')
    compose('pull')
    compose('up', '-d')
    print('dev-s3 installed. Credentials: /srv/services/dev-s3/credentials/wildrift.env')


def backup():
    backup_dir = DATA / 'backups'
    backup_dir.mkdir(mode=0o700, exist_ok=True)
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    target = backup_dir / f'dev-s3-{stamp}.tar.gz'
    partial = target.with_suffix(target.suffix + '.partial')
    was_running = bool(compose('ps', '--status', 'running', '-q', capture=True).stdout.strip())
    if was_running:
        compose('stop')
    try:
        with open(partial, 'xb') as out:
            os.chmod(partial, 0o600)
            with tarfile.open(fileobj=out, mode='w:gz') as archive:
                archive.add(DATA / 'data', arcname='data')
                archive.add(ROOT, arcname='service')
            out.flush()
            os.fsync(out.fileno())
        with gzip.open(partial, 'rb') as check:
            while check.read(1024 * 1024):
                pass
        os.replace(partial, target)
        print(f'Backup complete: {target}')
    finally:
        if was_running:
            compose('start')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=('install', 'status', 'start', 'stop', 'backup', 'logs'))
    parser.add_argument('--owner', default=os.environ.get('SUDO_USER', 'life'))
    args = parser.parse_args()
    if os.geteuid() != 0:
        parser.error('Run with sudo. No password is stored by this script.')
    with open('/run/lock/dev-s3-manage.lock', 'w') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        if args.action == 'install':
            install(args.owner)
        else:
            if (ROOT / '.managed-dev-s3').read_text() != MARKER:
                raise RuntimeError('Managed dev-s3 installation not found.')
            if args.action == 'status':
                compose('ps')
                run('du', '-sh', str(DATA / 'data'))
            elif args.action == 'backup':
                backup()
            elif args.action == 'logs':
                compose('logs', '--tail', '100')
            else:
                compose(args.action)


if __name__ == '__main__':
    main()
