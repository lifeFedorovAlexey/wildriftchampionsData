# wildriftchampionsData

Main frontend repository for `wildriftallstats.ru`.

## Release

- Current UI release: `1.1.0`
- Release branch format: `release/x.y.z`
- UI package version lives in [ui/package.json](/d:/wildRiftChampions/ui/package.json)

Release docs:

- [UI README](/d:/wildRiftChampions/ui/README.md)
- [Release Guide](/d:/wildRiftChampions/RELEASE.md)
- [Changelog](/d:/wildRiftChampions/CHANGELOG.md)

## Structure

- `ui/` - Next.js frontend, guide sync scripts, styles and app routes
- `.github/workflows/` - deploy and scheduled sync jobs
- `champions/` - champion data used by sync and stats flows

## Notes

- The frontend proxies the API through `/wr-api/*`
- The scheduled guides sync job also runs from this repository
