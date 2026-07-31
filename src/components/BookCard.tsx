import Link from 'next/link';
import { Book } from '@/lib/types';
import { truncate } from '@/lib/utils';

export default function BookCard({ book }: { book: Book }) {
  return (
    <Link href={`/books/${book.slug}`} className="group block bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-amber-500/50 hover:-translate-y-1 transition-all duration-300">
      <div className="relative aspect-[3/4] bg-zinc-800 overflow-hidden flex items-center justify-center">
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <span className="text-4xl text-zinc-600">📖</span>
        )}
        <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-zinc-900 to-transparent"></div>
        {book.type === 'post' && (
          <span className="absolute top-3 right-3 bg-amber-500 text-zinc-950 text-xs font-medium px-2 py-0.5 rounded-full">
            Blog Post
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-zinc-100 group-hover:text-amber-400 transition-colors">
          {book.title}
        </h3>
        {book.description && (
          <p className="mt-1 text-sm text-zinc-400">
            {book.description.length > 120 ? `${book.description.substring(0, 120)}...` : book.description}
          </p>
        )}
      </div>
    </Link>
  );
}
