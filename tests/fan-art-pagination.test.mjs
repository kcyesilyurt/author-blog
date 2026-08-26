import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FAN_ART_PAGE_SIZE,
  FAN_ART_OWN_PAGE_SIZE,
  fanArtCursorFilter,
  fanArtOwnCursorFilter,
  parseFanArtCursor,
  parseFanArtOwnCursor,
  toFanArtPage,
  toFanArtOwnPage,
} from '../src/lib/fan-art-pagination.ts';

function row(index, moderatedAt = `2026-08-20T12:00:${String(59 - index).padStart(2, '0')}.000Z`) {
  return {
    id: index + 1,
    title: `Art ${index + 1}`,
    caption: null,
    altText: 'Erişilebilir görsel açıklaması',
    imageUrl: `https://example.com/${index + 1}.webp`,
    width: 1200,
    height: 800,
    createdAt: '2026-08-20T10:00:00.000Z',
    artistName: 'Bir okur',
    moderatedAt,
  };
}

test('fan art pages use a sentinel row and a stable two-column cursor', () => {
  const rows = Array.from({ length: FAN_ART_PAGE_SIZE + 1 }, (_, index) => row(index));
  const page = toFanArtPage(rows);

  assert.equal(page.items.length, FAN_ART_PAGE_SIZE);
  assert.equal('moderatedAt' in page.items[0], false);
  assert.deepEqual(page.nextCursor, {
    moderatedAt: rows[FAN_ART_PAGE_SIZE - 1].moderatedAt,
    id: rows[FAN_ART_PAGE_SIZE - 1].id,
  });
  assert.equal(toFanArtPage(rows.slice(0, FAN_ART_PAGE_SIZE)).nextCursor, null);
});

test('fan art cursor validation rejects injected or non-canonical values', () => {
  const valid = { moderatedAt: '2026-08-20T12:34:56.789123+00:00', id: 42 };
  assert.deepEqual(parseFanArtCursor(valid), valid);
  assert.equal(parseFanArtCursor(null), null);
  assert.equal(
    fanArtCursorFilter(valid),
    'moderated_at.lt.2026-08-20T12:34:56.789123+00:00,and(moderated_at.eq.2026-08-20T12:34:56.789123+00:00,id.lt.42)'
  );

  for (const value of [
    {},
    [],
    { ...valid, extra: true },
    { ...valid, id: 0 },
    { ...valid, id: 1.5 },
    { ...valid, moderatedAt: '2026-02-30T12:34:56.000Z' },
    { ...valid, moderatedAt: '2026-08-20T12:34:56.000Z,id.gt.0' },
  ]) {
    assert.throws(() => parseFanArtCursor(value), /Sayfalama bilgisi geçersiz/);
  }
});

test('owner history uses activity pagination so old moderation changes remain discoverable', () => {
  const rows = Array.from({ length: FAN_ART_OWN_PAGE_SIZE + 1 }, (_, index) => ({
    id: index + 1,
    title: `Gönderi ${index + 1}`,
    status: 'approved',
    createdAt: '2026-01-01T00:00:00.000Z',
    moderationReason: null,
    activityAt: `2026-08-20T12:00:${String(59 - index).padStart(2, '0')}.000Z`,
  }));
  const page = toFanArtOwnPage(rows);

  assert.equal(page.items.length, FAN_ART_OWN_PAGE_SIZE);
  assert.equal('activityAt' in page.items[0], false);
  assert.deepEqual(page.nextCursor, {
    activityAt: rows[FAN_ART_OWN_PAGE_SIZE - 1].activityAt,
    id: rows[FAN_ART_OWN_PAGE_SIZE - 1].id,
  });

  const valid = { activityAt: '2026-08-20T12:34:56.000Z', id: 42 };
  assert.deepEqual(parseFanArtOwnCursor(valid), valid);
  assert.equal(
    fanArtOwnCursorFilter(valid),
    'activity_at.lt.2026-08-20T12:34:56.000Z,and(activity_at.eq.2026-08-20T12:34:56.000Z,id.lt.42)'
  );
  assert.throws(
    () => parseFanArtOwnCursor({ ...valid, activityAt: 'now(),id.gt.0' }),
    /Sayfalama bilgisi geçersiz/
  );
});
