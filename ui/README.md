# Wild Rift SSR

Frontend for `wildriftallstats.ru` running on Next.js.

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
- `GUIDES_SYNC_TOKEN` - bearer token for guide import requests
- `GUIDES_SYNC_SECRET` - optional shared secret header for guide import requests

Server-rendered pages such as `winrates` and `tierlist` also respect `API_PROXY_TARGET`.
For local development, set either `API_PROXY_TARGET` or `STATS_API_ORIGIN` to a reachable stats backend.

## Guides Flow

- `ui/scripts/parse-wildriftfire-guide.js` scrapes one champion guide and writes a local JSON cache
- `ui/scripts/sync-wildriftfire-guides.js` scrapes one or many champions and upserts them into the WR API
- the guides page first tries `GET /api/guides/:slug?lang=ru_ru` from the WR API and only falls back to local JSON if the API has no guide yet

Expected WR API endpoints:

- `POST /api/guides/import`
- `GET /api/guides/:slug?lang=ru_ru`
- `GET /api/guides?fields=slug`

The import payload is:

```json
{
  "guide": { "...full normalized guide payload..." },
  "source": "wildriftfire",
  "fetchedAt": "2026-03-21T12:00:00.000Z"
}
```

## Production

Production deploys run to the Timeweb server via GitHub Actions.
