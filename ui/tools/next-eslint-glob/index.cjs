/* eslint-disable @typescript-eslint/no-require-imports -- Next loads this adapter through CommonJS. */
const { globSync: tinyGlobSync } = require("tinyglobby");
const { isAbsolute } = require("node:path");

// Next's ESLint plugin only uses fast-glob.globSync to discover root directories.
// Avoid its unpatched braces dependency without changing directory expansion.
function globSync(patterns, options = {}) {
  return tinyGlobSync(patterns, {
    ...options,
    absolute: options.absolute ?? (typeof patterns === "string" && isAbsolute(patterns)),
    expandDirectories: false,
  }).map(
    (path) => path.replace(/\/$/, ""),
  );
}

module.exports = { globSync };
