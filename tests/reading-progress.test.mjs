import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  READING_POSITION_VERSION,
  calculateReadingProgress,
  clampReadingProgress,
  getChapterNavigation,
  getReadingPositionStorageKey,
  getScrollTopForReadingProgress,
  parseReadingPosition,
  shouldOfferReadingResume,
} from '../src/lib/reading-progress.ts';

test('reading progress is clamped and maps back to a stable scroll target', () => {
  const metrics = {
    scrollY: 400,
    articleTop: 100,
    articleHeight: 1100,
    viewportHeight: 500,
    topOffset: 64,
    bottomOffset: 64,
  };

  assert.equal(calculateReadingProgress(metrics), 0.5);
  assert.equal(getScrollTopForReadingProgress(0.5, metrics), 400);
  assert.equal(clampReadingProgress(-1), 0);
  assert.equal(clampReadingProgress(4), 1);
  assert.equal(clampReadingProgress(Number.NaN), 0);
});

test('short chapters complete once their reading area reaches the viewport', () => {
  const metrics = {
    scrollY: 36,
    articleTop: 100,
    articleHeight: 300,
    viewportHeight: 500,
    topOffset: 64,
    bottomOffset: 64,
  };

  assert.equal(calculateReadingProgress(metrics), 1);
  assert.equal(calculateReadingProgress({ ...metrics, scrollY: 0 }), 0);
});

test('stored reading positions are versioned and validated defensively', () => {
  const position = {
    version: READING_POSITION_VERSION,
    bookId: 'book-1',
    bookSlug: 'kitap',
    chapterId: 'chapter-2',
    chapterSlug: 'ikinci-bolum',
    progress: 0.42,
    updatedAt: 1_786_000_000_000,
  };

  assert.deepEqual(parseReadingPosition(JSON.stringify(position), 'book-1'), position);
  assert.equal(parseReadingPosition('{bozuk', 'book-1'), null);
  assert.equal(
    parseReadingPosition(JSON.stringify({ ...position, bookId: 'other' }), 'book-1'),
    null
  );
  assert.equal(
    parseReadingPosition(JSON.stringify({ ...position, progress: 2 }), 'book-1'),
    null
  );
  assert.equal(getReadingPositionStorageKey('book-1'), 'ods:reading-position:book-1');
  assert.equal(shouldOfferReadingResume(0.03), true);
  assert.equal(shouldOfferReadingResume(0.95), true);
  assert.equal(shouldOfferReadingResume(0.02), false);
  assert.equal(shouldOfferReadingResume(0.96), false);
});

test('chapter navigation handles ends, missing chapters and tied order values', () => {
  const chapters = [
    { id: 'b', book_id: 'book', title: 'İkinci', slug: 'ikinci', chapter_order: 2 },
    { id: 'a', book_id: 'book', title: 'Birinci', slug: 'birinci', chapter_order: 1 },
    { id: 'c', book_id: 'book', title: 'Ek', slug: 'ek', chapter_order: 2 },
  ];

  const middle = getChapterNavigation(chapters, 'b');
  assert.deepEqual(middle.sorted.map((chapter) => chapter.id), ['a', 'b', 'c']);
  assert.equal(middle.previous?.id, 'a');
  assert.equal(middle.next?.id, 'c');
  assert.equal(getChapterNavigation(chapters, 'a').previous, null);
  assert.equal(getChapterNavigation(chapters, 'c').next, null);
  assert.equal(getChapterNavigation(chapters, 'missing').currentIndex, -1);
});

test('reader enhancement keeps server-rendered prose and mobile safety hooks', async () => {
  const [reader, continueLink, styles, globals, chapterPage, bookPage] = await Promise.all([
    readFile(new URL('../src/components/ReaderExperience.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/ContinueReadingLink.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/ReaderExperience.module.css', import.meta.url), 'utf8'),
    readFile(new URL('../src/app/globals.css', import.meta.url), 'utf8'),
    readFile(
      new URL('../src/app/books/[slug]/[chapterSlug]/page.tsx', import.meta.url),
      'utf8'
    ),
    readFile(new URL('../src/app/books/[slug]/page.tsx', import.meta.url), 'utf8'),
  ]);

  assert.match(reader, /ResizeObserver/);
  assert.match(reader, /visualViewport/);
  assert.match(reader, /requestAnimationFrame/);
  assert.match(reader, /addEventListener\('focusin'/);
  assert.match(reader, /get\('resume'\) === '1'/);
  assert.match(reader, /prefetch=\{false\}/);
  assert.match(continueLink, /Okumaya devam et/);
  assert.match(continueLink, /shouldOfferReadingResume\(position\.progress\)/);
  assert.match(styles, /safe-area-inset-bottom/);
  assert.match(styles, /prefers-reduced-motion:\s*reduce/);
  assert.match(globals, /\.reader-content\s*\{[^}]*font-size:\s*1\.125rem/s);
  assert.match(globals, /"Sitka Text"/);
  assert.match(chapterPage, /<ReaderExperience/);
  assert.match(chapterPage, /<MarkdownRenderer content=\{currentChapter\.content\}/);
  assert.match(bookPage, /id="bolumler"/);
  assert.match(bookPage, /<ContinueReadingLink/);
});
