# Wild Rift SSR

Frontend for `wildriftallstats.ru` running on Next.js.

## Commands

```bash
npm run dev
npm run build
npm run start
npm run test
```

## Environment

- `API_PROXY_TARGET` - server-side proxy target for `/wr-api/*`
- `STATS_API_ORIGIN` - direct stats API origin for server fetches
- `NEXT_PUBLIC_API_BASE` - public base path for browser requests, default `/wr-api`

Server-rendered pages such as `winrates` and `tierlist` also respect `API_PROXY_TARGET`.
For local development, set either `API_PROXY_TARGET` or `STATS_API_ORIGIN` to a reachable stats backend.

## Production

Production deploys run to the Timeweb server via GitHub Actions.
