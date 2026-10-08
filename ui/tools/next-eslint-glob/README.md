# Next ESLint root-directory glob adapter

Scoped to `@next/eslint-plugin-next` through the UI package overrides. The plugin
uses `globSync(pattern, { onlyDirectories: true })`; this adapter preserves that
behavior using tinyglobby, with automatic directory expansion disabled and
directory trailing slashes normalized.

This removes fast-glob → micromatch → braces from the lint dependency tree.
braces 3.0.3 has no patched release for
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
Remove this adapter when Next switches to a safe glob implementation upstream.
