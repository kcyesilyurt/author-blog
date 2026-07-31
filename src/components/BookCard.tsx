import Link from 'next/link';
import { Book } from '@/lib/types';

export default function BookCard({ book }: { book: Book }) {
  return (
    <Link href={`/books/${book.slug}`} className="group block glass-card bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 hover:border-pink-400/30 hover:-translate-y-1 transition-all duration-300">
      <div className="relative aspect-[3/4] bg-neutral-800 overflow-hidden flex items-center justify-center">
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <span className="text-4xl text-neutral-600">📖</span>
        )}
        <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-neutral-900 to-transparent"></div>
        {book.type === 'post' && (
          <span className="absolute top-3 right-3 bg-pink-400 text-black text-xs font-medium px-2 py-0.5 rounded-full">
            Blog Yazısı
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white group-hover:text-pink-300 transition-colors">
          {book.title}
        </h3>
        {book.description && (
          <p className="mt-1 text-sm text-neutral-400">
            {book.description.length > 120 ? `${book.description.substring(0, 120)}...` : book.description}
          </p>
        )}
      </div>
    </Link>
  );
}
