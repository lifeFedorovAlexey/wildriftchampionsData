# Changelog

## 1.2.1 - 2026-04-06

- fixed production champion icon delivery so guide index cards use the public S3 asset contract after setting `ASSET_PUBLIC_MODE=s3`
- reduced `/guides` data cache duration so fresh API icon URLs and lane metadata reach the UI quickly after deploys
- aligned docs and release notes around the S3-first asset policy and captured remaining cleanup work for legacy proxy fallbacks

## 1.2.0 - 2026-04-06

- added zero-downtime UI deploys with release directories, canary health checks, and rollback support
- rebuilt the guides index with lighter API payloads, lane filters, compact cards, and full 136-champion coverage
- reworked guide detail pages with integrated RiftGG filters, matchup previews, denser build layouts, and clearer empty states
- added Boosty support in the footer with official branding and a donation QR
- cleaned up shared guide lane and slug helpers to reduce duplicated logic across UI and sync scripts

## 1.1.0 - 2026-03-23

- refreshed the Next.js app shell with the new global header and footer
- reworked homepage and shared UI primitives for a cleaner stats-first experience
- added reusable UI building blocks for avatars, search, pills and loading skeletons
- expanded guides flow support and tests around guide sync and API origin resolution
- hardened WildRiftFire sync diagnostics with CI config validation and import endpoint preflight

