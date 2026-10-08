/* eslint-disable @typescript-eslint/no-require-imports -- Next loads this adapter through CommonJS. */
const { globSync: tinyGlobSync } = require("tinyglobby");
const { isAbsolute, parse } = require("node:path");
const { existsSync } = require("node:fs");

// Next's ESLint plugin only uses fast-glob.globSync to discover root directories.
// Avoid its unpatched braces dependency without changing directory expansion.
function globSync(patterns, options = {}) {
  if (typeof patterns === "string" && options.onlyDirectories) {
    const root = parse(patterns).root.replace(/\\/g, "/");
    if (root && patterns === root) return existsSync(root) ? [root] : [];
  }
  return tinyGlobSync(patterns, {
    ...options,
    absolute: options.absolute ?? (typeof patterns === "string" && isAbsolute(patterns)),
    expandDirectories: false,
  }).map(
    (path) => path.replace(/([^/:])\/$/, "$1"),
  );
}

module.exports = { globSync };
