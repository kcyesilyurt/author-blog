import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertReasonableLinkCount,
  isPubliclyVisible,
  optionalHttpsUrl,
  parsePublicationInput,
  requireEmail,
  requireSlug,
  requireUuid,
} from '../src/lib/validation.ts';
import { slugify } from '../src/lib/utils.ts';

test('UUID and slug validators reject malformed identifiers', () => {
  assert.equal(
    requireUuid('c1111111-1111-1111-1111-111111111111'),
    'c1111111-1111-1111-1111-111111111111'
  );
  assert.equal(requireSlug('gece-notlari'), 'gece-notlari');
  assert.throws(() => requireUuid('not-an-id'));
  assert.throws(() => requireSlug('../admin'));
});

test('publication transitions produce safe dates', () => {
  const now = new Date('2026-08-02T12:00:00.000Z');
  assert.deepEqual(parsePublicationInput('draft', '2026-08-03', now), {
    status: 'draft',
    publishedAt: null,
  });
  assert.deepEqual(parsePublicationInput('published', '', now), {
    status: 'published',
    publishedAt: now.toISOString(),
  });
  assert.throws(() => parsePublicationInput('scheduled', '2026-08-01T12:00:00.000Z', now));
});

test('only due published or scheduled records are public', () => {
  const now = new Date('2026-08-02T12:00:00.000Z');
  assert.equal(
    isPubliclyVisible({ status: 'published', published_at: '2026-08-02T11:00:00.000Z' }, now),
    true
  );
  assert.equal(
    isPubliclyVisible({ status: 'scheduled', published_at: '2026-08-02T13:00:00.000Z' }, now),
    false
  );
  assert.equal(
    isPubliclyVisible({ status: 'draft', published_at: '2026-08-01T13:00:00.000Z' }, now),
    false
  );
});

test('community content limits excessive links', () => {
  assert.doesNotThrow(() => assertReasonableLinkCount('https://a.test ve https://b.test'));
  assert.throws(() =>
    assertReasonableLinkCount('https://a.test https://b.test https://c.test')
  );
});

test('contact fields accept normal email and HTTPS links only', () => {
  assert.equal(requireEmail(' Okur@Example.com '), 'okur@example.com');
  assert.equal(optionalHttpsUrl('https://example.com/etkinlik'), 'https://example.com/etkinlik');
  assert.equal(optionalHttpsUrl(''), null);
  assert.throws(() => requireEmail('okur@example'));
  assert.throws(() => optionalHttpsUrl('http://example.com'));
});

test('Turkish work titles keep stable ASCII slugs', () => {
  assert.equal(slugify('Kayıp Liman'), 'kayip-liman');
  assert.equal(
    slugify('Hâinin Mührü 1 - Kayıp Liman'),
    'hainin-muhru-1-kayip-liman'
  );
  assert.equal(
    slugify('Tanrı Kuyusu’nun Kemikleri'),
    'tanri-kuyusunun-kemikleri'
  );
  assert.equal(slugify('Kül ve Keder Çağı'), 'kul-ve-keder-cagi');
  assert.equal(slugify('  Bir -- Başka ___ Eser  '), 'bir-baska-eser');
});
