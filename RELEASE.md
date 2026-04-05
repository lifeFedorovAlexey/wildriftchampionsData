# Release Guide

## Version bump

1. Update the version in `ui/package.json`
2. Mirror the same version in `ui/package-lock.json`
3. Add a new section to `CHANGELOG.md`
4. Create the release branch as `release/x.y.z`
5. Create the stable tag as `vx.y.z`

## Checks before release

1. Run `npm run test` in `ui/`
2. Run `npm run build` in `ui/`
3. If the scheduled guides job changed, verify `GUIDES_SYNC_API_ORIGIN` and `GUIDES_SYNC_SECRET`
4. Confirm the public import endpoint responds on `https://wildriftallstats.ru/wr-api/api/guides/import`
5. Confirm the UI deploy workflow still has the expected `S3_PUBLIC_BASE_URL`

## Branching

1. Branch from the release candidate commit
2. Push `release/x.y.z`
3. Push tag `vx.y.z`
4. Verify GitHub Actions on the release branch
5. Merge to `main` only after deploy readiness is confirmed

## Deploy expectations

- UI deploys run via `.github/workflows/deploy-timeweb.yml`
- The workflow builds a fresh release in `/var/www/wildriftchampionsData/ui/releases/<timestamp>`
- A canary instance is checked on `http://127.0.0.1:3100/api/health`
- Only after a healthy canary does the workflow replace the live PM2 process on port `3000`

