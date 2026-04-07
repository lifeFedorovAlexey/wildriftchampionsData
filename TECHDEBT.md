# Tech Debt

## S3 asset policy

- Production champion icons are now expected to use public S3 URLs.
- Required production env on `wr-api`:
  - `ASSET_PUBLIC_MODE=s3`
  - `S3_PUBLIC_BASE_URL=<public bucket base>`
- Client-facing pages should not depend on donor-host image URLs or `/wr-api/icons/:slug?src=...` for champion icons.

## Remaining remnants to remove

- [wr-api/lib/championIcons.mjs](/d:/wildRiftChampions/wr-api/lib/championIcons.mjs)
  still contains the legacy proxy/runtime mirror path builder (`/wr-api/icons/:slug?src=...`).
  It is acceptable as a server-side fallback, but should stop being part of the normal production client contract.

- [wr-api/lib/guideAssets.mjs](/d:/wildRiftChampions/wr-api/lib/guideAssets.mjs)
  and [wr-api/lib/guideHeroMedia.mjs](/d:/wildRiftChampions/wr-api/lib/guideHeroMedia.mjs)
  still rely on runtime fallback/proxy behavior.
  These paths should eventually move to the same explicit S3-first contract used for champion icons.

- [wr-api/lib/guideAssets.mjs](/d:/wildRiftChampions/wr-api/lib/guideAssets.mjs)
  currently mixes two concerns in one store:
  persistent runtime cache on the server and temporary staging for import/CI mirrors before S3 upload.
  This should be split later into:
  a runtime-facing asset cache policy and a separate temp/workspace upload flow for pipelines,
  so import jobs do not depend on server-style cache directories and the production host does not accumulate unnecessary local mirrored assets.

- [wr-api/scripts/sync-assets-to-s3.mjs](/d:/wildRiftChampions/wr-api/scripts/sync-assets-to-s3.mjs)
  exists, but champion icon prewarming is not wired into the regular champion update workflow.
  This is currently acceptable because new champions are rare, but the policy should remain explicit: no hourly S3 thrashing, only targeted backfill when new assets appear.

- [wr-api/lib/remoteAssetPolicy.mjs](/d:/wildRiftChampions/wr-api/lib/remoteAssetPolicy.mjs)
  still allows donor hosts needed by runtime mirror fallbacks.
  Once asset migration is fully prewarmed, this allowlist can be narrowed.

## Tests still worth adding

- API contract tests that assert `GET /api/champions`, `GET /api/guides`, `GET /api/tierlist*`, and `GET /api/winrates*` never emit `src=` in champion icon URLs when `ASSET_PUBLIC_MODE=s3`.
- More end-to-end coverage around guide detail payloads so opponent and hero media assets follow the intended public URL policy.

## Admin auth follow-up

- Add end-to-end coverage for admin OAuth start/callback routes behind a reverse proxy so production never regresses to `localhost` or `http` redirect URIs.
- Consider stronger environment separation for admin OAuth testing:
  local development on `localhost:3000` and production `wildriftallstats.ru` can still confuse a browser session if both flows are tested in parallel with stale provider/session cookies.
