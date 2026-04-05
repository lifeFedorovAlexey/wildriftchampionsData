# Wild Rift SSR

Next.js frontend for `wildriftallstats.ru`.

## Version

- Current version: `1.2.0`
- Release branch format: `release/x.y.z`
- Stable tag format: `v1.2.0`

## Commands

```bash
npm run dev
npm run build
npm run start
npm run test
npm run scrape:guide -- lux
npm run sync:guides -- lux braum
npm run sync:guides:all
```

## Environment

- `API_PROXY_TARGET` - server-side proxy target for `/wr-api/*`
- `STATS_API_ORIGIN` - direct stats API origin for server fetches
- `NEXT_PUBLIC_API_BASE` - public base path for browser requests, default `/wr-api`
- `GUIDES_SYNC_API_ORIGIN` - WR API origin used by the guide sync job
- `GUIDES_SYNC_IMPORT_URL` - optional full import endpoint override
- `GUIDES_SYNC_SECRET` - shared secret header for guide import requests
- `S3_PUBLIC_BASE_URL` - public base used for mirrored assets in production

Server-rendered pages such as `winrates` and `tierlist` also respect `API_PROXY_TARGET`.

## Guides flow

- `ui/scripts/parse-wildriftfire-guide.js` scrapes one champion guide and writes a local JSON cache
- `ui/scripts/sync-wildriftfire-guides.js` gets champion slugs from the WR API, scrapes one or many guides, and upserts them into the WR API
- the guides page first tries `GET /api/guides/:slug?lang=ru_ru` from the WR API and only falls back to local JSON if the API has no guide yet

Expected WR API endpoints:

- `POST /api/guides/import`
- `GET /api/guides/:slug?lang=ru_ru`
- `GET /api/guides?fields=slug`
- `GET /api/champions?lang=ru_ru&fields=names`
- `GET /api/guides?fields=index`

## Release checklist

1. Bump `version` in `package.json` and `package-lock.json`
2. Add release notes to `/CHANGELOG.md`
3. Run `npm run test`
4. Run `npm run build`
5. Verify the guide sync secrets point to `https://wildriftallstats.ru/wr-api`
6. Push the release branch as `release/x.y.z`
7. Push the stable tag as `vx.y.z`

## Production

Production deploys run to the Timeweb server via GitHub Actions.

- `.github/workflows/deploy-timeweb.yml` builds a fresh UI release
- the workflow checks a canary instance on `127.0.0.1:3100`
- after a healthy canary it replaces the live PM2 process on `127.0.0.1:3000`
- guide sync runs separately from `.github/workflows/sync-guides.yml`
