'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Book, PublicChapter, PublicChapterListItem } from '@/lib/types';
import {
  READING_POSITION_VERSION,
  calculateReadingProgress,
  clampReadingProgress,
  getChapterNavigation,
  getReadingPositionStorageKey,
  getScrollTopForReadingProgress,
  parseReadingPosition,
  shouldOfferReadingResume,
  type ReadingMetrics,
} from '@/lib/reading-progress';
import styles from '@/components/ReaderExperience.module.css';

const NAVBAR_HEIGHT = 64;
const SAVE_DELAY_MS = 750;

type ReaderExperienceProps = {
  book: Pick<Book, 'id' | 'slug' | 'title'>;
  chapter: Pick<PublicChapter, 'id' | 'slug' | 'title'>;
  chapters: PublicChapterListItem[];
  children: ReactNode;
};

function isTextEntryTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const control = target.closest<HTMLElement>('input, textarea, select, [contenteditable]');
  if (!control) return false;
  return control.getAttribute('contenteditable') !== 'false';
}

export default function ReaderExperience({
  book,
  chapter,
  chapters,
  children,
}: ReaderExperienceProps) {
  const readerRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLElement>(null);
  const progressRef = useRef(0);
  const saveTimerRef = useRef<number | null>(null);
  const shouldPersistRef = useRef(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [resumeProgress, setResumeProgress] = useState<number | null>(null);
  const [dockHidden, setDockHidden] = useState(false);
  const navigation = useMemo(
    () => getChapterNavigation(chapters, chapter.id),
    [chapters, chapter.id]
  );

  const getMetrics = useCallback((): ReadingMetrics | null => {
    const reader = readerRef.current;
    if (!reader) return null;

    const rect = reader.getBoundingClientRect();
    return {
      scrollY: window.scrollY,
      articleTop: rect.top + window.scrollY,
      articleHeight: reader.offsetHeight,
      viewportHeight: window.visualViewport?.height ?? window.innerHeight,
      topOffset: NAVBAR_HEIGHT,
      bottomOffset: dockRef.current?.getBoundingClientRect().height ?? 0,
    };
  }, []);

  const persistPosition = useCallback(() => {
    if (!shouldPersistRef.current) return;

    try {
      localStorage.setItem(
        getReadingPositionStorageKey(book.id),
        JSON.stringify({
          version: READING_POSITION_VERSION,
          bookId: book.id,
          bookSlug: book.slug,
          chapterId: chapter.id,
          chapterSlug: chapter.slug,
          progress: clampReadingProgress(progressRef.current),
          updatedAt: Date.now(),
        })
      );
    } catch {
      // Reading progress is an enhancement; unavailable storage must not block reading.
    }
  }, [book.id, book.slug, chapter.id, chapter.slug]);

  const queuePositionSave = useCallback(() => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      persistPosition();
    }, SAVE_DELAY_MS);
  }, [persistPosition]);

  const restorePosition = useCallback(
    (value: number, requestedBehavior: ScrollBehavior) => {
      const metrics = getMetrics();
      if (!metrics) return;

      const nextProgress = clampReadingProgress(value);
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      shouldPersistRef.current = true;
      progressRef.current = nextProgress;
      setProgressPercent(Math.round(nextProgress * 100));
      window.scrollTo({
        top: getScrollTopForReadingProgress(nextProgress, metrics),
        behavior: reducedMotion ? 'auto' : requestedBehavior,
      });
      queuePositionSave();
    },
    [getMetrics, queuePositionSave]
  );

  const flushPosition = useCallback(() => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    persistPosition();
  }, [persistPosition]);

  useEffect(() => {
    let cancelled = false;
    let measureFrame = 0;
    let promptFrame = 0;
    let pendingMeasurementShouldPersist = false;

    shouldPersistRef.current = false;

    let storedPosition = null;
    try {
      storedPosition = parseReadingPosition(
        localStorage.getItem(getReadingPositionStorageKey(book.id)),
        book.id
      );
    } catch {
      storedPosition = null;
    }

    const storedPositionMatchesChapter = storedPosition?.chapterId === chapter.id;

    const measure = (persistIfChanged: boolean) => {
      const metrics = getMetrics();
      if (!metrics) return;

      const previousProgress = progressRef.current;
      const nextProgress = calculateReadingProgress(metrics);
      progressRef.current = nextProgress;
      setProgressPercent(Math.round(nextProgress * 100));

      if (persistIfChanged && Math.abs(nextProgress - previousProgress) >= 0.002) {
        shouldPersistRef.current = true;
        setResumeProgress(null);
        queuePositionSave();
      }
    };

    const requestMeasure = (persistIfChanged: boolean) => {
      pendingMeasurementShouldPersist ||= persistIfChanged;
      if (measureFrame) return;

      measureFrame = window.requestAnimationFrame(() => {
        measureFrame = 0;
        const shouldPersist = pendingMeasurementShouldPersist;
        pendingMeasurementShouldPersist = false;
        measure(shouldPersist);
      });
    };

    requestMeasure(false);

    if (!storedPositionMatchesChapter) {
      shouldPersistRef.current = true;
      persistPosition();
    } else if (storedPosition) {
      const hasHashTarget = window.location.hash.length > 1;
      const wantsAutomaticResume =
        new URLSearchParams(window.location.search).get('resume') === '1';

      if (!hasHashTarget && wantsAutomaticResume && storedPosition.progress > 0) {
        const restoreAfterLayout = () => {
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
              if (!cancelled) restorePosition(storedPosition.progress, 'auto');
            });
          });
        };

        if ('fonts' in document) {
          void document.fonts.ready.then(restoreAfterLayout);
        } else {
          restoreAfterLayout();
        }
      } else if (
        !hasHashTarget &&
        shouldOfferReadingResume(storedPosition.progress)
      ) {
        promptFrame = window.requestAnimationFrame(() => {
          if (!cancelled) setResumeProgress(storedPosition.progress);
        });
      }
    }

    const handleScroll = () => requestMeasure(true);
    const handleResize = () => requestMeasure(false);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushPosition();
    };
    const handleFocusIn = (event: FocusEvent) => {
      setDockHidden(isTextEntryTarget(event.target));
    };
    const handleFocusOut = () => {
      window.requestAnimationFrame(() => {
        setDockHidden(isTextEntryTarget(document.activeElement));
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('pagehide', flushPosition);
    window.visualViewport?.addEventListener('resize', handleResize, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => requestMeasure(false));
    if (readerRef.current) resizeObserver?.observe(readerRef.current);
    if ('fonts' in document) {
      void document.fonts.ready.then(() => {
        if (!cancelled) requestMeasure(false);
      });
    }

    return () => {
      cancelled = true;
      if (measureFrame) window.cancelAnimationFrame(measureFrame);
      if (promptFrame) window.cancelAnimationFrame(promptFrame);
      resizeObserver?.disconnect();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pagehide', flushPosition);
      window.visualViewport?.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      flushPosition();
    };
  }, [
    book.id,
    chapter.id,
    flushPosition,
    getMetrics,
    persistPosition,
    queuePositionSave,
    restorePosition,
  ]);

  const handleResume = () => {
    if (resumeProgress === null) return;
    const nextProgress = resumeProgress;
    setResumeProgress(null);
    restorePosition(nextProgress, 'smooth');
  };

  const currentPositionLabel =
    navigation.currentIndex >= 0
      ? `${navigation.currentIndex + 1} / ${navigation.sorted.length}`
      : `${navigation.sorted.length} bölüm`;

  return (
    <>
      <div ref={readerRef}>{children}</div>

      <div
        role="progressbar"
        aria-label="Bölüm okuma ilerlemesi"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPercent}
        className={styles.progressTrack}
      >
        <div
          className={styles.progressValue}
          style={{ transform: `scaleX(${progressPercent / 100})` }}
        />
      </div>

      {resumeProgress !== null && (
        <div
          role="status"
          className={`${styles.resumePrompt} ${dockHidden ? styles.promptHidden : ''}`}
        >
          <button type="button" className={styles.resumeButton} onClick={handleResume}>
            Kaldığın yere dön · %{Math.round(resumeProgress * 100)}
          </button>
          <button
            type="button"
            aria-label="Okuma konumu hatırlatıcısını kapat"
            className={styles.dismissButton}
            onClick={() => setResumeProgress(null)}
          >
            ×
          </button>
        </div>
      )}

      <nav
        ref={dockRef}
        aria-label="Mobil bölüm navigasyonu"
        className={`${styles.dock} ${dockHidden ? styles.dockHidden : ''}`}
      >
        <div className={styles.dockInner}>
          {navigation.previous ? (
            <Link
              href={`/books/${book.slug}/${navigation.previous.slug}`}
              prefetch={false}
              onNavigate={flushPosition}
              aria-label={`Önceki bölüm: ${navigation.previous.title}`}
              className={`${styles.dockItem} ${styles.dockLink}`}
            >
              <span aria-hidden="true">←</span>
              <span className={styles.dockLabel}>Önceki</span>
            </Link>
          ) : (
            <span aria-disabled="true" className={`${styles.dockItem} ${styles.dockDisabled}`}>
              <span aria-hidden="true">←</span>
              <span className={styles.dockLabel}>Önceki</span>
            </span>
          )}

          <Link
            href={`/books/${book.slug}#bolumler`}
            prefetch={false}
            onNavigate={flushPosition}
            className={`${styles.dockItem} ${styles.dockLink}`}
          >
            <span className={styles.dockLabel}>Bölümler</span>
            <span className={styles.dockMeta}>{currentPositionLabel}</span>
          </Link>

          {navigation.next ? (
            <Link
              href={`/books/${book.slug}/${navigation.next.slug}`}
              prefetch={false}
              onNavigate={flushPosition}
              aria-label={`Sonraki bölüm: ${navigation.next.title}`}
              className={`${styles.dockItem} ${styles.dockLink}`}
            >
              <span aria-hidden="true">→</span>
              <span className={styles.dockLabel}>Sonraki</span>
            </Link>
          ) : (
            <span aria-disabled="true" className={`${styles.dockItem} ${styles.dockDisabled}`}>
              <span aria-hidden="true">→</span>
              <span className={styles.dockLabel}>Sonraki</span>
            </span>
          )}
        </div>
      </nav>
    </>
  );
}
