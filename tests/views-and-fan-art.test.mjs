import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const viewMigrationUrl = new URL(
  '../supabase/migrations/20260820110356_add_publication_views.sql',
  import.meta.url
);
const fanArtMigrationUrl = new URL(
  '../supabase/migrations/20260820110402_add_fan_art.sql',
  import.meta.url
);

test('publication views are atomic, deduplicated and service-role only', async () => {
  const sql = await readFile(viewMigrationUrl, 'utf8');

  assert.match(sql, /add column if not exists view_count bigint not null default 0/gi);
  assert.match(sql, /check \(view_count >= 0\)/i);
  assert.match(sql, /publication_view_dedup_one_target_check/i);
  assert.match(sql, /where book_id is not null/i);
  assert.match(sql, /where chapter_id is not null/i);
  assert.match(sql, /on conflict \(book_id, actor_hash\)[\s\S]*interval '24 hours'/i);
  assert.match(sql, /set view_count = view_count \+ 1/i);
  assert.match(sql, /interval '30 days'/i);
  assert.match(sql, /p_batch_size is null or p_batch_size not between 1 and 50000/i);
  assert.match(sql, /create extension if not exists pg_cron/i);
  assert.match(sql, /cron\.schedule\([\s\S]*prune-publication-view-dedup-hourly/i);
  assert.match(sql, /alter table public\.publication_view_dedup enable row level security/i);
  assert.match(
    sql,
    /revoke execute on function public\.record_publication_view\(text, uuid, text\)[\s\S]*from public, anon, authenticated/i
  );
  assert.match(
    sql,
    /grant execute on function public\.record_publication_view\(text, uuid, text\)[\s\S]*to service_role/i
  );
  assert.doesNotMatch(sql, /(?:books|chapters)_view_count_idx/i);
});

test('view tracking happens after hydration and never invalidates publication cache', async () => {
  const [tracker, action] = await Promise.all([
    readFile(new URL('../src/components/TrackedViewCount.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/app/books/actions.ts', import.meta.url), 'utf8'),
  ]);

  assert.match(tracker, /useEffect\(\(\) =>/);
  assert.match(tracker, /recordedRef\.current/);
  assert.match(tracker, /recordPublicationView\(contentType, contentId\)/);
  assert.doesNotMatch(action, /revalidatePath|revalidateTag|updateTag|refresh\(/);
  assert.match(action, /getScopedActorHash/);
});

test('fan art metadata is private and only approved derivatives are public', async () => {
  const sql = await readFile(fanArtMigrationUrl, 'utf8');

  assert.match(sql, /create table if not exists public\.fan_art_submissions/i);
  assert.doesNotMatch(sql, /\bbytea\b/i);
  assert.match(sql, /references public\.profiles\(id\) on delete restrict/i);
  assert.match(sql, /alter table public\.fan_art_submissions enable row level security/i);
  assert.match(
    sql,
    /revoke all on table public\.fan_art_submissions[\s\S]*from public, anon, authenticated/i
  );
  assert.match(sql, /grant select, insert, update, delete[\s\S]*to service_role/i);
  assert.match(sql, /fan_art_approved_cursor_idx/i);
  assert.match(sql, /fan_art_pending_queue_idx/i);
  assert.match(sql, /'fan-art-staging',[\s\S]*false,[\s\S]*6291456/i);
  assert.match(sql, /'fan-art',[\s\S]*true,[\s\S]*6291456,[\s\S]*image\/webp/i);
  assert.match(sql, /'fan_art_upload'/i);
  assert.match(sql, /status = 'processing'/i);
  assert.match(
    sql,
    /status = 'uploading'[\s\S]*?staging_path is not null[\s\S]*?staging_path = upload_path/i
  );
  assert.match(
    sql,
    /status = 'processing'[\s\S]*?staging_path is not null[\s\S]*?staging_path = upload_path/i
  );
  assert.match(
    sql,
    /status = 'cancelled'[\s\S]*?staging_path is not null[\s\S]*?staging_path = upload_path/i
  );
  assert.match(sql, /status = 'approved'[\s\S]*public_path is not null/i);
  assert.match(sql, /create table if not exists public\.fan_art_storage_cleanup_jobs/i);
  assert.match(
    sql,
    /alter table public\.fan_art_storage_cleanup_jobs enable row level security/i
  );
  assert.match(sql, /fan_art_cleanup_due_idx/i);
  assert.match(sql, /fan_art_cleanup_claim_shape_check/i);
  assert.match(sql, /create or replace function public\.claim_fan_art_storage_cleanup/i);
  assert.match(sql, /pg_advisory_xact_lock[\s\S]*fan-art-reservation:/i);
  assert.match(sql, /create or replace function public\.claim_fan_art_processing/i);
  assert.match(sql, /processing_started_at[\s\S]*interval '10 minutes'/i);
  assert.match(sql, /processing_token = p_processing_token/i);
  assert.match(sql, /create or replace function public\.mark_fan_art_pending/i);
  assert.match(sql, /create or replace function public\.approve_fan_art_submission/i);
  assert.match(sql, /status = 'removed'/i);
  assert.match(sql, /create or replace function public\.take_down_fan_art_submission/i);
  assert.match(sql, /fan_art_user_activity_idx[\s\S]*activity_at desc, id desc/i);
  assert.equal((sql.match(/activity_at = pg_catalog\.now\(\)/gi) ?? []).length, 4);
  assert.match(
    sql,
    /if p_actor_hash is null[\s\S]*or p_action is null[\s\S]*or p_limit is null[\s\S]*or p_window_seconds is null/i
  );
  assert.match(
    sql,
    /revoke execute on function public\.take_down_fan_art_submission[\s\S]*from public, anon, authenticated/i
  );
});

test('fan art uses direct signed upload, sanitization and admin reauthorization', async () => {
  const [publicActions, gallery, adminActions] = await Promise.all([
    readFile(new URL('../src/app/fan-art/actions.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/FanArtGallery.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/app/admin/fan-art/actions.ts', import.meta.url), 'utf8'),
  ]);

  assert.match(publicActions, /createSignedUploadUrl\(path, \{ upsert: false \}\)/);
  assert.match(publicActions, /sanitizeFanArtImage\(source\)/);
  assert.match(publicActions, /'claim_fan_art_processing'/);
  assert.match(
    publicActions,
    /if \(downloadError \|\| !source\) \{[\s\S]*releaseProcessingClaim\([\s\S]*'cancelled'\s*\)/
  );
  assert.match(publicActions, /enqueueFanArtCleanup/);
  assert.match(publicActions, /cacheControl: '0'/);
  assert.match(gallery, /uploadToSignedUrl\(ticket\.path, ticket\.token, file/);
  assert.match(gallery, /<Image[\s\S]*?src=\{item\.imageUrl\}[\s\S]*?unoptimized/);
  assert.match(publicActions, /'pending', 'approved', 'rejected', 'removed'/);
  assert.equal((adminActions.match(/await requireAdmin\(\)/g) ?? []).length, 5);
  assert.match(adminActions, /\.from\('fan-art'\)[\s\S]*\.upload\(publicPath/);
  assert.match(adminActions, /'take_down_fan_art_submission'/);
  assert.match(adminActions, /cacheControl: '3600'/);

  const adminPage = await readFile(
    new URL('../src/app/admin/fan-art/page.tsx', import.meta.url),
    'utf8'
  );
  assert.match(adminPage, /<Image[\s\S]*unoptimized/);
  assert.match(adminPage, /Yayından Kaldır/);
});

test('fan art cleanup has an authenticated periodic worker', async () => {
  const [route, vercelConfig, envExample] = await Promise.all([
    readFile(
      new URL('../src/app/api/cron/fan-art-cleanup/route.ts', import.meta.url),
      'utf8'
    ),
    readFile(new URL('../vercel.json', import.meta.url), 'utf8'),
    readFile(new URL('../.env.local.example', import.meta.url), 'utf8'),
  ]);

  assert.match(route, /!cronSecret/);
  assert.match(route, /authorization/);
  assert.match(route, /`Bearer \$\{cronSecret\}`/);
  assert.match(route, /cleanupDueFanArtObjects/);
  assert.match(route, /result\.scanned === 0 \|\|\s*result\.claimed === 0/);
  assert.match(route, /Date\.now\(\) - startedAt >= STOP_AFTER_MS/);
  assert.match(envExample, /^CRON_SECRET=/m);

  const config = JSON.parse(vercelConfig);
  assert.deepEqual(config.crons, [
    {
      path: '/api/cron/fan-art-cleanup',
      schedule: '17 3 * * *',
    },
  ]);
});
