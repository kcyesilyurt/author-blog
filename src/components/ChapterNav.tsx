import Link from 'next/link';
import { Chapter } from '@/lib/types';

export default function ChapterNav({ bookSlug, chapters, currentChapterId }: { bookSlug: string; chapters: Chapter[]; currentChapterId: string }) {
  const sorted = [...chapters].sort((a, b) => a.chapter_order - b.chapter_order);
  const currentIndex = sorted.findIndex(c => c.id === currentChapterId);
  const prev = currentIndex > 0 ? sorted[currentIndex - 1] : null;
  const next = currentIndex !== -1 && currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null;

  return (
    <div className="border-t border-zinc-800 pt-8 mt-12 flex items-stretch justify-between gap-4">
      {prev ? (
        <Link href={`/books/${bookSlug}/${prev.slug}`} className="bg-zinc-900 hover:bg-zinc-800 rounded-lg px-5 py-4 transition-colors flex-1 group border border-zinc-800 hover:border-zinc-700">
          <div className="text-xs text-zinc-500 uppercase tracking-wider">← Previous</div>
          <div className="text-sm font-medium text-zinc-200 group-hover:text-amber-400 transition-colors mt-1">{prev.title}</div>
        </Link>
      ) : (
        <div className="flex-1"></div>
      )}
      
      {next ? (
        <Link href={`/books/${bookSlug}/${next.slug}`} className="bg-zinc-900 hover:bg-zinc-800 rounded-lg px-5 py-4 transition-colors flex-1 group border border-zinc-800 hover:border-zinc-700 text-right">
          <div className="text-xs text-zinc-500 uppercase tracking-wider">Next →</div>
          <div className="text-sm font-medium text-zinc-200 group-hover:text-amber-400 transition-colors mt-1">{next.title}</div>
        </Link>
      ) : (
        <div className="flex-1"></div>
      )}
    </div>
  );
}
