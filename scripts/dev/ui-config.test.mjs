import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

function configFor(env) {
  const moduleUrl = new URL('../../ui/next.config.ts', import.meta.url).href;
  const code = `const {default: config} = await import(${JSON.stringify(moduleUrl)}); console.log(JSON.stringify({distDir: config.distDir || '.next', tsconfig: config.typescript?.tsconfigPath || 'tsconfig.json', localImages: config.images.dangerouslyAllowLocalIP, rewrites: await config.rewrites()}));`;
  return JSON.parse(execFileSync(process.execPath, ['--experimental-strip-types', '--input-type=module', '-e', code], {
    encoding: 'utf8', windowsHide: true,
    env: { ...process.env, NODE_OPTIONS: '', API_PROXY_TARGET: '', STATS_API_ORIGIN: 'https://api.production.example',
      S3_PUBLIC_BASE_URL: 'https://storage.production.example/assets', NEXT_DIST_DIR: '.must-not-be-used', ...env },
  }));
}

test('production ignores local build and image settings even with WR_LOCAL_DEV enabled', () => {
  for (const env of [{ NODE_ENV: 'production', WR_LOCAL_DEV: 'true' }, { NODE_ENV: 'development', WR_LOCAL_DEV: '' }]) {
    const config = configFor(env);
    assert.equal(config.distDir, '.next');
    assert.equal(config.tsconfig, 'tsconfig.json');
    assert.equal(config.localImages, false);
    assert.equal(config.rewrites[0].destination, 'https://api.production.example/:path*');
  }
});

test('explicit local development uses a separate build, TypeScript config and local images', () => {
  const config = configFor({ NODE_ENV: 'development', WR_LOCAL_DEV: 'true' });
  assert.equal(config.distDir, '.next-local');
  assert.equal(config.tsconfig, '.tsconfig.local.json');
  assert.equal(config.localImages, true);
});
