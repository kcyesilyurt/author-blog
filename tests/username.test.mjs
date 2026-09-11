import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  RESERVED_USERNAMES,
  optionalUsername,
} from '../src/lib/validation.ts';
import {
  formatPublicUsername,
  getCommunityDisplayName,
} from '../src/lib/community-identity.ts';

const migrationUrl = new URL(
  '../supabase/migrations/20260910141005_add_optional_usernames.sql',
  import.meta.url
);

test('optional usernames are stored in one lowercase canonical form', () => {
  assert.equal(optionalUsername(null), null);
  assert.equal(optionalUsername(''), null);
  assert.equal(optionalUsername('   '), null);
  assert.equal(optionalUsername(' Deniz_7 '), 'deniz_7');
  assert.equal(optionalUsername('abc'), 'abc');
  assert.equal(optionalUsername('okur_42'), 'okur_42');
  assert.equal(
    optionalUsername(`a${'b'.repeat(USERNAME_MAX_LENGTH - 2)}z`),
    `a${'b'.repeat(USERNAME_MAX_LENGTH - 2)}z`
  );
  assert.equal(USERNAME_MIN_LENGTH, 3);
  assert.equal(USERNAME_MAX_LENGTH, 24);
});

test('optional usernames reject malformed, confusing and reserved handles', () => {
  for (const username of [
    'ab',
    `a${'b'.repeat(USERNAME_MAX_LENGTH - 1)}z`,
    '@',
    '@   ',
    '@Deniz_7',
    '@ deniz_7',
    '_deniz',
    'deniz_',
    'de niz',
    'deniz-k',
    'deniz.k',
    'çağla',
    'İpek',
    'okur📚',
  ]) {
    assert.throws(() => optionalUsername(username), undefined, username);
  }

  for (const username of ['ADMIN', 'moderator', 'destek', 'yazar', 'anonymous']) {
    assert.throws(() => optionalUsername(username), /kullanılamaz/i, username);
  }
});

test('community names prefer @username and preserve every previous fallback', () => {
  assert.equal(formatPublicUsername('deniz_7'), '@deniz_7');
  assert.equal(formatPublicUsername('@deniz_7'), '@deniz_7');
  assert.equal(formatPublicUsername(''), null);

  assert.equal(
    getCommunityDisplayName({
      user_id: 'user-1',
      guest_name: null,
      profiles: {
        username: 'deniz_7',
        first_name: 'Deniz',
        last_name: 'Yılmaz',
        display_name: 'Deniz Yılmaz',
      },
    }),
    '@deniz_7'
  );
  assert.equal(
    getCommunityDisplayName({
      user_id: 'user-1',
      guest_name: null,
      profiles: {
        username: null,
        first_name: 'Deniz',
        last_name: 'Yılmaz',
        display_name: 'Deniz Yılmaz',
      },
    }),
    'Deniz Y.'
  );
  assert.equal(
    getCommunityDisplayName({
      user_id: null,
      guest_name: '  Misafir Okur  ',
      profiles: null,
    }),
    'Misafir Okur'
  );
  assert.equal(
    getCommunityDisplayName({ user_id: 'user-1', guest_name: null, profiles: null }),
    'Okur'
  );
  assert.equal(
    getCommunityDisplayName({ user_id: null, guest_name: null, profiles: null }),
    'Anonim'
  );
});

test('username migration keeps handles optional, unique and publicly readable only', async () => {
  const sql = await readFile(migrationUrl, 'utf8');

  assert.match(sql, /add column if not exists username text/i);
  assert.doesNotMatch(sql, /add column if not exists username text\s+not null/i);
  assert.match(sql, /profiles_username_format_check/i);
  assert.match(sql, /char_length\(username\) between 3 and 24/i);
  assert.match(sql, /username = pg_catalog\.lower\(username\)/i);
  assert.match(sql, /\(username collate "C"\) ~ '\^\[a-z0-9\]/i);
  assert.match(sql, /profiles_username_reserved_check/i);
  assert.match(
    sql,
    /create unique index if not exists profiles_username_lower_uidx[\s\S]*lower\(username\)[\s\S]*where username is not null/i
  );
  assert.match(
    sql,
    /grant select \(username\) on table public\.profiles to anon, authenticated/i
  );
  assert.doesNotMatch(sql, /grant select on table public\.profiles/i);
  assert.doesNotMatch(
    sql,
    /grant\s+(?:insert|update|delete)[^;]*public\.profiles[^;]*to\s+(?:anon|authenticated)/i
  );

  const reservedBlock = sql.match(
    /profiles_username_reserved_check[\s\S]*?username not in \(([\s\S]*?)\)\s*\) not valid/i
  );
  assert.ok(reservedBlock);
  const databaseReserved = [...reservedBlock[1].matchAll(/'([^']+)'/g)].map(
    (match) => match[1]
  );
  assert.deepEqual(databaseReserved.sort(), [...RESERVED_USERNAMES].sort());
});

test('profile and community data paths include username and map duplicate claims safely', async () => {
  const [profileAction, profilePage, communityAction, comments, pano, adminComments] =
    await Promise.all([
      readFile(new URL('../src/app/profile/actions.ts', import.meta.url), 'utf8'),
      readFile(new URL('../src/app/profile/page.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../src/app/community/actions.ts', import.meta.url), 'utf8'),
      readFile(new URL('../src/components/CommentSection.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../src/components/PanoBoard.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../src/app/admin/comments/page.tsx', import.meta.url), 'utf8'),
    ]);

  assert.match(profileAction, /formData\.has\('username'\)/);
  assert.match(profileAction, /username = optionalUsername\(formData\.get\('username'\)\)/);
  assert.match(profileAction, /\.eq\('is_banned', false\)[\s\S]*\.select\('username'\)/);
  assert.match(profileAction, /profileError\?\.code === '23505'/);
  assert.match(profileAction, /Bu kullanıcı adı zaten alınmış/);
  assert.doesNotMatch(profileAction, /profileError\.message/);
  assert.match(profilePage, /first_name, last_name, username, avatar_url/);
  assert.match(communityAction, /id, username, display_name, first_name, last_name/);
  assert.match(communityAction, /username: profile\.username/g);
  assert.match(comments, /getCommunityDisplayName\(comment\)/);
  assert.match(pano, /getCommunityDisplayName\(message\)/);
  assert.match(adminComments, /profiles\(username, display_name\)/);
});
