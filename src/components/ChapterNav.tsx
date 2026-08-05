import Link from 'next/link';
import type { PublicChapterListItem } from '@/lib/types';

export default function ChapterNav({ bookSlug, chapters, currentChapterId }: { bookSlug: string; chapters: PublicChapterListItem[]; currentChapterId: string }) {
  const sorted = [...chapters].sort((a, b) => a.chapter_order - b.chapter_order);
  const currentIndex = sorted.findIndex(c => c.id === currentChapterId);
  const prev = currentIndex > 0 ? sorted[currentIndex - 1] : null;
  const next = currentIndex !== -1 && currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null;

  return (
    <div className="border-t border-neutral-800 pt-8 mt-12 flex flex-col sm:flex-row items-stretch justify-between gap-4">
      {prev ? (
        <Link href={`/books/${bookSlug}/${prev.slug}`} className="bg-neutral-900 hover:bg-neutral-800 rounded-lg px-4 py-5 sm:px-5 sm:py-4 transition-colors flex-1 group border border-neutral-800 hover:border-pink-400/30">
          <div className="text-xs text-neutral-500 uppercase tracking-wider">← Önceki</div>
          <div className="text-sm font-medium text-neutral-200 group-hover:text-pink-300 transition-colors mt-1">{prev.title}</div>
        </Link>
      ) : (
        <div className="flex-1"></div>
      )}
      
      {next ? (
        <Link href={`/books/${bookSlug}/${next.slug}`} className="bg-neutral-900 hover:bg-neutral-800 rounded-lg px-4 py-5 sm:px-5 sm:py-4 transition-colors flex-1 group border border-neutral-800 hover:border-pink-400/30 text-right">
          <div className="text-xs text-neutral-500 uppercase tracking-wider">Sonraki →</div>
          <div className="text-sm font-medium text-neutral-200 group-hover:text-pink-300 transition-colors mt-1">{next.title}</div>
        </Link>
      ) : (
        <div className="flex-1"></div>
      )}
    </div>
  );
}
