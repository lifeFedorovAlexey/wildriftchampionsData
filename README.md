# wildriftchampionsData

Main frontend repository for `wildriftallstats.ru`.

## Release

- Current UI release: `1.2.0`
- Release branch format: `release/x.y.z`
- Stable tag format: `v1.2.0`
- UI package version lives in [ui/package.json](/d:/wildRiftChampions/ui/package.json)

Release docs:

- [UI README](/d:/wildRiftChampions/ui/README.md)
- [Release Guide](/d:/wildRiftChampions/RELEASE.md)
- [Changelog](/d:/wildRiftChampions/CHANGELOG.md)

## Structure

- `ui/` - Next.js frontend, guide sync scripts, styles and app routes
- `.github/workflows/` - UI deploy and scheduled guide sync jobs
- `wr-api/` - API, champion import pipeline and storage-backed media delivery

## Notes

- The frontend proxies the API through `/wr-api/*`
- The scheduled guides sync job also runs from this repository
- UI deploys use release directories, a canary health check on port `3100`, and then replace the live PM2 process on port `3000`
- The guide sync workflow uses `GUIDES_SYNC_API_ORIGIN`, `GUIDES_SYNC_IMPORT_URL`, and `GUIDES_SYNC_SECRET`
