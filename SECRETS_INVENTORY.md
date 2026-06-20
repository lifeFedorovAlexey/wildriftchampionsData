# Secrets Inventory

This file is the source of truth for GitHub repository secrets used by the current deployment contour.

Do not add a new secret in code or workflow without adding it here and telling the project owner which repository needs it.

## Root / UI Repo

Current GitHub secrets:

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
- `USER_AUTH_ENABLED`
- `USER_SESSION_SECRET`
- `WR_CHAT_ORIGIN`

Expected chat value:

- `WR_CHAT_ORIGIN=https://wildriftallstats.ru/wr-chat`

## wr-api Repo

Current GitHub secrets:

- `ADMIN_BOOTSTRAP_EMAILS`
- `ADMIN_SESSION_SECRET`
- `ASSET_PUBLIC_MODE`
- `DATABASE_URL`
- `GUIDES_SYNC_SECRET`
- `S3_ACCESS_KEY_ID`
- `S3_BUCKET`
- `S3_ENDPOINT`
- `S3_FORCE_PATH_STYLE`
- `S3_PUBLIC_BASE_URL`
- `S3_SECRET_ACCESS_KEY`
- `TIMEWEB_HOST`
- `TIMEWEB_PASSWORD`
- `TIMEWEB_USER`
- `USER_SESSION_SECRET`
- `WR_CHAT_SHARED_SECRET`

Notes:

- `WR_CHAT_SHARED_SECRET` must exactly match the value in the `wr-chat` repo.
- It signs the `wr-api` to `wr-chat` session handoff and authorizes internal chat persistence/access checks.

## wr-chat Repo

Current GitHub secrets:

- `TIMEWEB_CHAT_HOST`
- `TIMEWEB_CHAT_PASSWORD`
- `TIMEWEB_CHAT_USER`
- `WR_API_ORIGIN`
- `WR_CHAT_ALLOWED_ORIGINS`
- `WR_CHAT_PUBLIC_ORIGIN`
- `WR_CHAT_SHARED_SECRET`

Expected same-server chat values:

- `WR_CHAT_PUBLIC_ORIGIN=https://wildriftallstats.ru/wr-chat`
- `WR_API_ORIGIN=https://wildriftallstats.ru/wr-api`
- `WR_CHAT_ALLOWED_ORIGINS=https://wildriftallstats.ru`
- `WR_CHAT_SHARED_SECRET=<same value as wr-api>`

## Adding New Secrets

Before adding a new secret:

1. Add the code or workflow use.
2. Add the key to this inventory.
3. Update the relevant `.env.example` or README.
4. Tell the owner exactly which GitHub repo needs the key and whether it must match another repo.
