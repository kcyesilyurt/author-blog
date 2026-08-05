import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COMMUNITY_PAGE_SIZE,
  appendUniqueById,
  communityCursorFilter,
  parseCommunityCursor,
  prependUniqueById,
  toCommunityPage,
} from '../src/lib/community-pagination.ts';

const UUIDS = Array.from(
  { length: COMMUNITY_PAGE_SIZE + 1 },
  (_, index) => `00000000-0000-0000-0000-${String(index + 1).padStart(12, '0')}`
);

function row(index, createdAt = `2026-08-06T12:00:${String(59 - index).padStart(2, '0')}.000Z`) {
  return { id: UUIDS[index], created_at: createdAt };
}

test('community pages use a 21st sentinel and expose a stable two-column cursor', () => {
  const twentyRows = Array.from({ length: COMMUNITY_PAGE_SIZE }, (_, index) => row(index));
  const fullPage = toCommunityPage(twentyRows);
  assert.equal(fullPage.items.length, COMMUNITY_PAGE_SIZE);
  assert.equal(fullPage.nextCursor, null);

  const sentinelPage = toCommunityPage([...twentyRows, row(COMMUNITY_PAGE_SIZE)]);
  assert.equal(sentinelPage.items.length, COMMUNITY_PAGE_SIZE);
  assert.deepEqual(sentinelPage.nextCursor, {
    createdAt: twentyRows.at(-1).created_at,
    id: twentyRows.at(-1).id,
  });
});

test('cursor validation accepts only the exact canonical shape', () => {
  const cursor = {
    createdAt: '2026-08-06T12:34:56.789Z',
    id: 'ABCDEF12-3456-7890-ABCD-EF1234567890',
  };
  assert.deepEqual(parseCommunityCursor(cursor), {
    ...cursor,
    id: cursor.id.toLowerCase(),
  });
  assert.deepEqual(
    parseCommunityCursor({
      ...cursor,
      createdAt: '2026-08-06T12:34:56.789123+00:00',
    }),
    {
      createdAt: '2026-08-06T12:34:56.789123+00:00',
      id: cursor.id.toLowerCase(),
    }
  );
  assert.equal(parseCommunityCursor(null), null);

  const invalidValues = [
    {},
    [],
    { ...cursor, extra: true },
    { ...cursor, createdAt: '2026-02-30T12:34:56.789Z' },
    { ...cursor, createdAt: '2026-08-06T25:34:56.000Z' },
    { ...cursor, createdAt: '2026-08-06T12:34:56.789Z,id.gt.0' },
    { ...cursor, id: 'not-a-uuid' },
  ];
  for (const value of invalidValues) {
    assert.throws(() => parseCommunityCursor(value), /Sayfalama bilgisi geçersiz/);
  }
});

test('community cursors preserve PostgREST microseconds without truncation', () => {
  const rows = Array.from({ length: COMMUNITY_PAGE_SIZE + 1 }, (_, index) =>
    row(index)
  );
  rows[COMMUNITY_PAGE_SIZE - 1] = row(
    COMMUNITY_PAGE_SIZE - 1,
    '2026-08-06T12:34:56.789123+00:00'
  );

  assert.equal(
    toCommunityPage(rows).nextCursor?.createdAt,
    '2026-08-06T12:34:56.789123+00:00'
  );
});

test('cursor filter contains the validated timestamp and UUID tie-breaker', () => {
  const cursor = parseCommunityCursor({
    createdAt: '2026-08-06T12:34:56.789Z',
    id: 'abcdef12-3456-7890-abcd-ef1234567890',
  });
  assert.ok(cursor);
  assert.equal(
    communityCursorFilter(cursor),
    'created_at.lt.2026-08-06T12:34:56.789Z,and(created_at.eq.2026-08-06T12:34:56.789Z,id.lt.abcdef12-3456-7890-abcd-ef1234567890)'
  );
});

test('append and prepend merges remove duplicate IDs without dropping order', () => {
  const first = { id: 'first' };
  const second = { id: 'second' };
  const third = { id: 'third' };

  assert.deepEqual(appendUniqueById([first, second], [second, third, third]), [
    first,
    second,
    third,
  ]);
  assert.deepEqual(prependUniqueById([first, second], second), [second, first]);
});
