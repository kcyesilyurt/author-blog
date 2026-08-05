import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  PUBLIC_BOOK_FIELDS,
  PUBLIC_CHAPTER_FIELDS,
  PUBLIC_CHAPTER_LIST_FIELDS,
  PUBLIC_CHAPTER_ROUTE_FIELDS,
  PUBLICATIONS_CACHE_TAG,
  PUBLICATIONS_REVALIDATE_SECONDS,
} from '../src/lib/publication-cache.ts';

test('public publication queries select only the data each page needs', () => {
  assert.doesNotMatch(PUBLIC_BOOK_FIELDS, /\*/);
  assert.doesNotMatch(PUBLIC_CHAPTER_FIELDS, /\*/);
  assert.doesNotMatch(PUBLIC_CHAPTER_LIST_FIELDS, /\*/);
  assert.doesNotMatch(PUBLIC_CHAPTER_ROUTE_FIELDS, /\*/);
  assert.match(PUBLIC_CHAPTER_FIELDS, /\bcontent\b/);
  assert.doesNotMatch(PUBLIC_CHAPTER_LIST_FIELDS, /\bcontent\b/);
  assert.doesNotMatch(PUBLIC_CHAPTER_ROUTE_FIELDS, /\bcontent\b/);
});

test('public publication cache stays fresh and has a shared invalidation tag', () => {
  assert.equal(PUBLICATIONS_CACHE_TAG, 'publications');
  assert.equal(PUBLICATIONS_REVALIDATE_SECONDS, 60);
});

test('public pages use the cached publication data layer', async () => {
  const pageUrls = [
    new URL('../src/app/page.tsx', import.meta.url),
    new URL('../src/app/books/[slug]/page.tsx', import.meta.url),
    new URL('../src/app/books/[slug]/[chapterSlug]/page.tsx', import.meta.url),
  ];
  const sources = await Promise.all(pageUrls.map((url) => readFile(url, 'utf8')));

  for (const source of sources) {
    assert.doesNotMatch(source, /\.select\(['"]\*['"]\)/);
    assert.doesNotMatch(source, /@\/lib\/supabase\/server/);
  }

  assert.match(sources[2], /getPublicChapter\(book\.id, chapterSlug\)/);
  assert.match(sources[2], /getPublicChapterList\(book\.id\)/);
  assert.match(sources[1], /generateStaticParams/);
  assert.match(sources[2], /generateStaticParams/);
});

test('admin publication changes invalidate the shared cache', async () => {
  const source = await readFile(
    new URL('../src/app/admin/actions.ts', import.meta.url),
    'utf8'
  );

  assert.match(source, /updateTag\(PUBLICATIONS_CACHE_TAG\)/);
  assert.match(source, /revalidatePath\('\/sitemap\.xml'\)/);
  assert.equal((source.match(/invalidatePublications\(\);/g) ?? []).length, 6);
});
