import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { root, runtime, apiRequire, connectDatabase, verifyDatabase } from './config.mjs';

export const setupScripts = [
  'setup-stats-table.mjs', 'setup-guides-table.mjs', 'setup-admin-tables.mjs',
  'setup-chat-tables.mjs', 'setup-quiz-tables.mjs', 'setup-news-tables.mjs',
  'setup-patch-notes-tables.mjs', 'setup-riftgg-cn-stats-table.mjs',
  'setup-champion-lore-table.mjs', 'setup-champion-stable-tips-table.mjs', 'setup-assistant-responses-table.mjs',
];

export const gameTables = [
  'champions', 'champion_stats_snapshots', 'champion_stats_history', 'champion_lore',
  'champion_stable_tips', 'assistant_responses', 'guide_summaries', 'guide_entities',
  'guide_official_meta', 'guide_abilities', 'guide_build_breakdowns', 'guide_variants',
  'guide_variant_sections', 'guide_variant_skill_orders', 'guide_variant_skill_rows',
  'guide_variant_matchups', 'news_articles', 'champion_events', 'patch_notes',
  'patch_note_source_revisions', 'patch_note_changes', 'patch_data_snapshots',
  'patch_data_snapshot_corrections', 'patch_data_transitions', 'patch_data_discrepancies',
  'riftgg_cn_dictionaries', 'riftgg_cn_matchups', 'riftgg_cn_builds', 'skin_collections', 'skin_entries',
];

export async function migrate(config, run) {
  const sql = connectDatabase(config);
  try {
    await verifyDatabase(sql);
    await sql.unsafe(fs.readFileSync(path.join(root, 'scripts/dev/base-schema.sql'), 'utf8'));
  } finally { await sql.end(); }
  for (const script of setupScripts) await run(script);
}

export async function seedFromOldLocal(config) {
  // Intentionally no general-purpose source URL: this command cannot read production.
  const sourceUrl = dotenv.parse(fs.readFileSync(path.join(root, 'wr-api/.env'))).DATABASE_URL;
  const parsed = new URL(sourceUrl);
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol) || parsed.hostname !== '127.0.0.1' || parsed.port !== '5434' || parsed.pathname !== '/wr_api' || parsed.search || parsed.hash) {
    throw new Error('Seed source must be the old local 127.0.0.1:5434/wr_api database.');
  }
  const source = apiRequire('postgres')(sourceUrl, { max: 1, connect_timeout: 5, onnotice() {}, connection: { default_transaction_read_only: 'on', application_name: 'wildrift-dev-readonly-copy' } });
  const dest = connectDatabase(config);
  const counts = {};
  try {
    await verifyDatabase(dest);
    await source.begin('isolation level repeatable read read only', async from => {
      await dest.begin(async to => {
        for (const table of gameTables) {
          // Empty destinations only: a repeated seed never overwrites local work.
          const [{ count }] = await to`select count(*)::int as count from ${to(table)}`;
          if (count) throw new Error(`Seed refused: ${table} contains data. Existing data was preserved.`);
        }
        for (const table of gameTables) {
          const columns = await from`select c.column_name, c.data_type, t.typelem::int as element_type from information_schema.columns c join pg_type t on t.typname = c.udt_name join pg_namespace n on n.oid = t.typnamespace and n.nspname = c.udt_schema where c.table_schema = 'public' and c.table_name = ${table} order by c.ordinal_position`;
          if (!columns.length) continue;
          const names = columns.map(row => row.column_name);
          const batchSize = Math.min(2000, Math.floor(60000 / columns.length));
          for await (const batch of from`select * from ${from(table)}`.cursor(batchSize)) {
            const rows = batch.map(row => Object.fromEntries(columns.map(({ column_name: name, data_type: type, element_type: elementType }) =>
              [name, row[name] == null ? null : type === 'jsonb' || type === 'json' ? to.json(row[name]) : type === 'ARRAY' ? to.array(row[name], elementType) : row[name]])));
            await to`insert into ${to(table)} ${to(rows, names)}`;
          }
          const [{ count }] = await to`select count(*)::int as count from ${to(table)}`;
          counts[table] = count;
          const sequences = await to`select column_name, pg_get_serial_sequence(${table}, column_name) as sequence from information_schema.columns where table_schema = 'public' and table_name = ${table}`;
          for (const { column_name: column, sequence } of sequences.filter(row => row.sequence)) {
            await to`select setval(${sequence}::regclass, greatest(coalesce(max(${to(column)}), 0), 1), max(${to(column)}) is not null) from ${to(table)}`;
          }
          console.log(`[seed] ${table}: ${count}`);
        }
      });
    });
    fs.writeFileSync(path.join(runtime, 'seed-report.json'), JSON.stringify({ source: 'old-local:5434/wr_api', copiedAt: new Date().toISOString(), counts }, null, 2));
  } finally { await Promise.all([source.end({ timeout: 5 }), dest.end({ timeout: 5 })]); }
  return counts;
}

export async function databaseStatus(config) {
  const sql = connectDatabase(config);
  try {
    await verifyDatabase(sql);
    const tables = await sql`select relname as name, n_live_tup::int as estimated_rows from pg_stat_user_tables order by relname`;
    const [info] = await sql`select pg_size_pretty(pg_database_size(current_database())) as size, (select count(*)::int from pg_stat_activity where datname = current_database()) as connections`;
    return { ok: true, database: 'wildrift_dev', role: 'wildrift_app', ...info, tables };
  } finally { await sql.end(); }
}
