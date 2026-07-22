# wildriftchampionsData

Main frontend repository for `wildriftallstats.ru`.

## Release

- Current UI release: `1.2.3`
- Release branch format: `release/x.y.z`
- Stable tag format: `v1.2.3`
- UI package version lives in [ui/package.json](./ui/package.json)

Release docs:

- [UI README](./ui/README.md)
- [Release Guide](./RELEASE.md)
- [Changelog](./CHANGELOG.md)
- [Secrets Inventory](./SECRETS_INVENTORY.md)

## Structure

- `ui/` - Next.js frontend, guide sync scripts, styles and app routes
- `.github/workflows/` - UI deploy and scheduled guide sync jobs
- `wr-api/` - API, champion import pipeline and storage-backed media delivery
- `wr-chat/` - dedicated realtime text-chat service

## Notes

- The frontend proxies the API through `/wr-api/*`
- The scheduled guides sync job also runs from this repository
- UI deploys use release directories, a canary health check on port `3100`, and then replace the live PM2 process on port `3000`
- The guide sync workflow uses `GUIDES_SYNC_API_ORIGIN`, `GUIDES_SYNC_IMPORT_URL`, and `GUIDES_SYNC_SECRET`
- Champion icons on client-facing pages are expected to resolve to public S3 URLs in production, not donor-host URLs or `/wr-api/icons?...src=...`
- Remaining S3 migration work is tracked in [Master Plan](./MASTER_PLAN.md) and [Architecture Status](./ARCHITECTURE_TASKS.md)

## Private quizzes

- `/quizzes` and every nested quiz route require a valid public-user session; unauthenticated visitors are redirected to `/me`
- the quiz navigation entry is resolved from `/api/auth/session` and is never rendered for guests
- quiz API routes also require a bearer session and return `401` for guests; authoring additionally requires the patron, streamer, or administrator role
- production quiz media is uploaded directly to S3 with a signed POST policy and a storage-enforced 5 MB limit; local `public/uploads` storage is intentionally unsupported
- run `npm run setup:quiz-media-storage` in `wr-api` once per bucket to configure browser upload CORS
- production must enable `USER_AUTH_ENABLED=true` in `ui`, configure the same dedicated `USER_SESSION_SECRET` in `ui` and `wr-api`, and provide the documented S3 settings in `wr-api`
