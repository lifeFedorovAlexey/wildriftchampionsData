-- Core tables not covered by wr-api/scripts/setup-*.mjs.
-- Executed ONLY after verifyDatabase confirms wildrift_dev/wildrift_app.
create table if not exists champions (
  slug text primary key, cn_hero_id text, name_localizations jsonb, name text,
  roles jsonb, roles_localizations jsonb, difficulty text, difficulty_localizations jsonb, icon text
);
create table if not exists champion_stats_history (
  id serial primary key, snapshot_id integer, date date not null, slug text not null,
  cn_hero_id text not null, rank text not null, lane text not null, position integer,
  win_rate double precision, pick_rate double precision, ban_rate double precision,
  strength_level integer, created_at timestamptz not null default now()
);
create table if not exists webapp_opens (
  id serial primary key, tg_id bigint not null, username text, first_name text,
  last_name text, opened_at timestamptz not null default now()
);
create index if not exists idx_webapp_opens_tg_id on webapp_opens(tg_id);
create table if not exists skin_collections (
  champion_slug text primary key, champion_name text not null, source text not null default 'merged-json',
  source_updated_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists skin_entries (
  id serial primary key, champion_slug text not null, skin_slug text not null, skin_name text not null,
  sort_order integer not null default 0, has_3d boolean not null default false,
  image_source_url text, image_asset_path text, model_source_url text, model_asset_path text,
  raw_payload jsonb, source_updated_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists skin_entries_champion_skin_uidx on skin_entries(champion_slug, skin_slug);
create index if not exists skin_entries_champion_sort_idx on skin_entries(champion_slug, sort_order);
create index if not exists skin_entries_skin_slug_idx on skin_entries(skin_slug);
