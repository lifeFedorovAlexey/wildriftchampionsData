# Release Guide

## Version bump

1. Update the version in `ui/package.json`
2. Mirror the same version in `ui/package-lock.json`
3. Add a new section to `CHANGELOG.md`
4. Create the release branch as `release/x.y.z`

## Checks before release

1. Run `npm run test` in `ui/`
2. Run `npm run build` in `ui/`
3. If the scheduled guides job changed, verify `GUIDES_SYNC_API_ORIGIN` and `GUIDES_SYNC_SECRET`
4. Confirm the public import endpoint responds on `https://wildriftallstats.ru/wr-api/api/guides/import`

## Branching

1. Branch from the release candidate commit
2. Push `release/x.y.z`
3. Verify GitHub Actions on the release branch
4. Merge to `main` only after deploy readiness is confirmed

