# Wild Rift SSR

Next.js frontend for `wildriftallstats.ru`.

## Version

- Current version: `1.2.2`
- Release branch format: `release/x.y.z`
- Stable tag format: `v1.2.2`

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
- `ADMIN_PUBLIC_ORIGIN` - canonical public admin origin for server-side OAuth redirects in production
- `ADMIN_SESSION_SECRET` - shared admin exchange secret, must match `wr-api`
- `ADMIN_GOOGLE_CLIENT_ID` / `ADMIN_GOOGLE_CLIENT_SECRET` - Google OAuth web app credentials
- `ADMIN_YANDEX_CLIENT_ID` / `ADMIN_YANDEX_CLIENT_SECRET` - Yandex OAuth app credentials
- `ADMIN_TELEGRAM_BOT_USERNAME` / `ADMIN_TELEGRAM_BOT_TOKEN` - Telegram login widget bot settings
- `ADMIN_VK_CLIENT_ID` / `ADMIN_VK_CLIENT_SECRET` - VK OAuth app credentials when VK login is enabled

Current frontend repo secret inventory:

- `ADMIN_GOOGLE_CLIENT_ID`
- `ADMIN_GOOGLE_CLIENT_SECRET`
- `ADMIN_SESSION_SECRET`
- `ADMIN_TELEGRAM_BOT_TOKEN`
- `ADMIN_TELEGRAM_BOT_USERNAME`
- `ADMIN_VK_CLIENT_ID`
- `ADMIN_VK_CLIENT_SECRET`
- `ADMIN_YANDEX_CLIENT_ID`
- `ADMIN_YANDEX_CLIENT_SECRET`
- `GUIDES_SYNC_API_ORIGIN`
- `GUIDES_SYNC_IMPORT_URL`
- `GUIDES_SYNC_SECRET`
- `S3_PUBLIC_BASE_URL`
- `TIMEWEB_HOST`
- `TIMEWEB_PASSWORD`
- `TIMEWEB_USER`

The `USER_*` env model is not part of the current approved frontend secret set and should be treated as unfinished work, not as the active production contract.

Server-rendered pages such as `winrates` and `tierlist` also respect `API_PROXY_TARGET`.

Admin OAuth notes:

- production should set `ADMIN_PUBLIC_ORIGIN=https://wildriftallstats.ru`
- local and production admin flows should not be tested in the same browser session when possible; prefer an incognito window for production checks after local OAuth testing

## Admin Login

Local setup:

1. Copy [ui/.env.local.example](/d:/wildRiftChampions/ui/.env.local.example) to `.env.local`
2. Set the same `ADMIN_SESSION_SECRET` that you use in `wr-api`
3. Fill only the provider you want to test first
4. Open `/admin/login`

Recommended first test:

- Google plus `ADMIN_BOOTSTRAP_EMAILS` in `wr-api`

Where to get values:

- `ADMIN_SESSION_SECRET`: same long random value as in `wr-api`
- `ADMIN_GOOGLE_CLIENT_ID` and `ADMIN_GOOGLE_CLIENT_SECRET`: create a Google OAuth web application in Google Cloud Console
  callback url: `http://localhost:3000/api/admin/auth/google/callback`
- `ADMIN_YANDEX_CLIENT_ID` and `ADMIN_YANDEX_CLIENT_SECRET`: create an OAuth app in Yandex OAuth
  callback url: `http://localhost:3000/api/admin/auth/yandex/callback`
- `ADMIN_TELEGRAM_BOT_USERNAME` and `ADMIN_TELEGRAM_BOT_TOKEN`: create a bot via BotFather in Telegram
  auth url: `http://localhost:3000/api/admin/auth/telegram/callback`
- `ADMIN_VK_*`: create a VK ID app
  callback url: `http://localhost:3000/api/admin/auth/vk/callback`

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
