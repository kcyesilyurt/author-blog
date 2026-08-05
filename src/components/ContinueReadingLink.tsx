'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { PublicChapterListItem } from '@/lib/types';
import {
  getReadingPositionStorageKey,
  parseReadingPosition,
  shouldOfferReadingResume,
  type ReadingPosition,
} from '@/lib/reading-progress';

type ContinueReadingLinkProps = {
  bookId: string;
  bookSlug: string;
  chapters: PublicChapterListItem[];
};

type ContinueTarget = {
  chapter: PublicChapterListItem;
  position: ReadingPosition;
};

export default function ContinueReadingLink({
  bookId,
  bookSlug,
  chapters,
}: ContinueReadingLinkProps) {
  const [target, setTarget] = useState<ContinueTarget | null>(null);

  useEffect(() => {
    const syncPosition = () => {
      try {
        const position = parseReadingPosition(
          localStorage.getItem(getReadingPositionStorageKey(bookId)),
          bookId
        );
        const chapter = position
          ? chapters.find((candidate) => candidate.id === position.chapterId)
          : null;
        setTarget(
          position && chapter && shouldOfferReadingResume(position.progress)
            ? { position, chapter }
            : null
        );
      } catch {
        setTarget(null);
      }
    };

    const initialFrame = window.requestAnimationFrame(syncPosition);
    window.addEventListener('storage', syncPosition);
    return () => {
      window.cancelAnimationFrame(initialFrame);
      window.removeEventListener('storage', syncPosition);
    };
  }, [bookId, chapters]);

  if (!target) return null;

  const percent = Math.round(target.position.progress * 100);

  return (
    <Link
      href={`/books/${bookSlug}/${target.chapter.slug}?resume=1`}
      aria-label={`Okumaya devam et: ${target.chapter.title}, yüzde ${percent}`}
      className="mb-6 flex min-h-14 w-full items-center justify-between gap-4 rounded-xl border border-[#F8D794]/20 bg-[#64090C]/15 px-4 py-3 text-left transition hover:border-[#F8D794]/40 hover:bg-[#64090C]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8D794]"
    >
      <span className="min-w-0">
        <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-[#F8D794]/60">
          Okumaya devam et
        </span>
        <span className="mt-1 block truncate font-medium text-[#EFEACD]">
          {target.chapter.title}
        </span>
      </span>
      <span className="shrink-0 rounded-full bg-[#F8D794]/10 px-3 py-1 text-sm font-semibold text-[#F8D794]">
        %{percent}
      </span>
    </Link>
  );
}
