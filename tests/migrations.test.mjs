import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationUrl = new URL(
  '../supabase/migrations/20260802180000_add_events_and_contact_messages.sql',
  import.meta.url
);

test('events and contact migration keeps the inbox private', async () => {
  const sql = await readFile(migrationUrl, 'utf8');

  assert.match(sql, /alter table public\.events enable row level security/i);
  assert.match(sql, /grant select on table public\.events to anon, authenticated/i);
  assert.match(sql, /alter table public\.contact_messages enable row level security/i);
  assert.match(
    sql,
    /revoke all on table public\.contact_messages from public, anon, authenticated/i
  );
  assert.match(sql, /contact_messages_user_id_idx/i);
  assert.doesNotMatch(
    sql,
    /grant\s+(?:select|insert|update|delete)[^;]*public\.contact_messages[^;]*to\s+(?:anon|authenticated)/i
  );
});

test('contact rate limiting and preserved event dates are included', async () => {
  const sql = await readFile(migrationUrl, 'utf8');

  assert.match(sql, /'avatar_upload', 'contact'/);
  assert.match(sql, /date '2025-12-06'/);
  assert.match(sql, /time '13:00'/);
  assert.match(sql, /date '2025-12-20'/);
});
