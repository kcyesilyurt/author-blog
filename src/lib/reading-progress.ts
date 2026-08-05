import type { PublicChapterListItem } from '@/lib/types';

export const READING_POSITION_VERSION = 1;
export const MIN_RESUME_PROGRESS = 0.03;
export const MAX_RESUME_PROGRESS = 0.95;

export type ReadingPosition = {
  version: typeof READING_POSITION_VERSION;
  bookId: string;
  bookSlug: string;
  chapterId: string;
  chapterSlug: string;
  progress: number;
  updatedAt: number;
};

export type ReadingMetrics = {
  scrollY: number;
  articleTop: number;
  articleHeight: number;
  viewportHeight: number;
  topOffset: number;
  bottomOffset: number;
};

export function clampReadingProgress(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function getScrollableDistance(metrics: ReadingMetrics) {
  const usableViewport = Math.max(
    1,
    metrics.viewportHeight - metrics.topOffset - metrics.bottomOffset
  );
  return Math.max(0, metrics.articleHeight - usableViewport);
}

export function calculateReadingProgress(metrics: ReadingMetrics) {
  if (metrics.articleHeight <= 0) return 0;

  const enteredDistance = metrics.scrollY + metrics.topOffset - metrics.articleTop;
  const scrollableDistance = getScrollableDistance(metrics);

  if (scrollableDistance === 0) {
    return enteredDistance >= 0 ? 1 : 0;
  }

  return clampReadingProgress(enteredDistance / scrollableDistance);
}

export function getScrollTopForReadingProgress(
  progress: number,
  metrics: ReadingMetrics
) {
  const target =
    metrics.articleTop -
    metrics.topOffset +
    clampReadingProgress(progress) * getScrollableDistance(metrics);

  return Math.max(0, target);
}

export function getReadingPositionStorageKey(bookId: string) {
  return `ods:reading-position:${bookId}`;
}

export function parseReadingPosition(
  rawValue: string | null,
  expectedBookId: string
): ReadingPosition | null {
  if (!rawValue) return null;

  try {
    const value = JSON.parse(rawValue) as Partial<ReadingPosition>;
    if (
      value.version !== READING_POSITION_VERSION ||
      value.bookId !== expectedBookId ||
      typeof value.bookSlug !== 'string' ||
      !value.bookSlug ||
      typeof value.chapterId !== 'string' ||
      !value.chapterId ||
      typeof value.chapterSlug !== 'string' ||
      !value.chapterSlug ||
      typeof value.progress !== 'number' ||
      !Number.isFinite(value.progress) ||
      value.progress < 0 ||
      value.progress > 1 ||
      typeof value.updatedAt !== 'number' ||
      !Number.isFinite(value.updatedAt) ||
      value.updatedAt <= 0
    ) {
      return null;
    }

    return value as ReadingPosition;
  } catch {
    return null;
  }
}

export function shouldOfferReadingResume(progress: number) {
  return progress >= MIN_RESUME_PROGRESS && progress <= MAX_RESUME_PROGRESS;
}

export function getChapterNavigation(
  chapters: PublicChapterListItem[],
  currentChapterId: string
) {
  const sorted = chapters
    .map((chapter, originalIndex) => ({ chapter, originalIndex }))
    .sort(
      (left, right) =>
        left.chapter.chapter_order - right.chapter.chapter_order ||
        left.originalIndex - right.originalIndex
    )
    .map(({ chapter }) => chapter);
  const currentIndex = sorted.findIndex((chapter) => chapter.id === currentChapterId);

  return {
    sorted,
    currentIndex,
    previous: currentIndex > 0 ? sorted[currentIndex - 1] : null,
    next:
      currentIndex >= 0 && currentIndex < sorted.length - 1
        ? sorted[currentIndex + 1]
        : null,
  };
}
