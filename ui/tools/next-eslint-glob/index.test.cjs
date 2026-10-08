/* eslint-disable @typescript-eslint/no-require-imports -- Exercise Next's CommonJS dependency resolution. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { getRootDirs } = require(
  path.join(path.dirname(require.resolve("@next/eslint-plugin-next")), "utils/get-root-dirs.js"),
);

test("Next ESLint discovers only requested roots with the safe glob adapter", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "next-eslint-glob-"));
  try {
    fs.mkdirSync(path.join(root, "apps", "web", "nested"), { recursive: true });
    fs.mkdirSync(path.join(root, "apps", "admin"), { recursive: true });
    fs.writeFileSync(path.join(root, "apps", "file.txt"), "fixture");
    const normalized = root.replace(/\\/g, "/");
    const discover = (rootDir) => getRootDirs({ cwd: root, settings: { next: { rootDir } } });
    assert.deepEqual(getRootDirs({ cwd: root, settings: {} }), [root]);
    assert.deepEqual(discover(`${normalized}/apps/web`), [`${normalized}/apps/web`]);
    assert.deepEqual(discover(`${normalized}/apps/*`).sort(), [
      `${normalized}/apps/admin`, `${normalized}/apps/web`,
    ]);
    assert.deepEqual(discover(`${normalized}/apps/{web,admin}`).sort(), [
      `${normalized}/apps/admin`, `${normalized}/apps/web`,
    ]);
    assert.deepEqual(discover([`${normalized}/apps/admin`, `${normalized}/missing`]), [
      `${normalized}/apps/admin`,
    ]);
    assert.deepEqual(discover(`${normalized}/apps/file.txt`), []);
    assert.deepEqual(discover(path.join(root, "apps", "web")), [`${normalized}/apps/web`]);
    const { globSync } = require("./index.cjs");
    assert.deepEqual(globSync("apps/*", { cwd: root, onlyDirectories: true }).sort(), [
      "apps/admin", "apps/web",
    ]);
    const filesystemRoot = path.parse(root).root.replace(/\\/g, "/");
    assert.deepEqual(globSync(filesystemRoot, { onlyDirectories: true }), [filesystemRoot]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
