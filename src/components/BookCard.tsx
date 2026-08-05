import Link from 'next/link';
import Image from 'next/image';
import { Book } from '@/lib/types';

export default function BookCard({ book }: { book: Book }) {
  return (
    <Link href={`/books/${book.slug}`} className="group block bordeaux-card rounded-xl overflow-hidden hover:-translate-y-1 transition-all duration-300">
      <div className="relative aspect-[3/4] bg-[#64090C]/20 overflow-hidden flex items-center justify-center">
        {book.cover_url ? (
          <Image
            src={book.cover_url}
            alt={book.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <span className="text-4xl text-[#64090C]">📖</span>
        )}
        <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-[#0E0000] to-transparent"></div>
        <span className="absolute top-3 right-3 bg-[#9C0512] text-[#F8D794] text-xs font-medium px-2 py-0.5 rounded-full">
          {book.type === 'post' ? 'Blog Yazısı' : 'Kitap'}
        </span>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-[#EFEACD] group-hover:text-[#F8D794] transition-colors">
          {book.title}
        </h3>
        {book.description && (
          <p className="mt-1 text-sm text-[#EFEACD]/50">
            {book.description.length > 120 ? `${book.description.substring(0, 120)}...` : book.description}
          </p>
        )}
      </div>
    </Link>
  );
}
