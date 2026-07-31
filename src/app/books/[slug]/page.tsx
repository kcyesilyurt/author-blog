import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Book, Chapter } from '@/lib/types';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: book } = await supabase.from('books').select('title, description').eq('slug', slug).single();

  if (!book) return { title: 'Eser Bulunamadı' };
  
  return {
    title: book.title,
    description: book.description || `${book.title} eserini oku`,
  };
}

export default async function BookPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!book) {
    notFound();
  }

  const { data: chapters } = await supabase
    .from('chapters')
    .select('*')
    .eq('book_id', book.id)
    .order('chapter_order', { ascending: true });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isPostType = book.type === 'post';

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
        {book.cover_url && (
          <div className="flex-shrink-0 w-56 sm:w-64 aspect-[3/4] relative rounded-xl shadow-2xl overflow-hidden border border-neutral-800">
            <Image 
              src={book.cover_url} 
              alt={`${book.title} kapak görseli`} 
              fill 
              className="object-cover"
              sizes="(max-width: 768px) 224px, 256px"
            />
          </div>
        )}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">{book.title}</h1>
          <p className="mt-4 text-base sm:text-lg text-neutral-300 leading-relaxed">
            {book.description}
          </p>
          <p className="text-sm text-neutral-500 mt-3">
            Yayınlanma tarihi: {formatDate(book.created_at)}
          </p>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold text-white mb-6">
          {isPostType ? 'İçerik' : 'Bölümler'}
        </h2>
        
        {(!chapters || chapters.length === 0) ? (
          <p className="text-neutral-500">Henüz bölüm bulunmuyor.</p>
        ) : (
          <div className="space-y-3">
            {chapters.map((chapter: Chapter) => (
              <Link 
                key={chapter.id} 
                href={`/books/${slug}/${chapter.slug}`}
                className="bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-lg px-5 py-4 flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-4">
                  {!isPostType && (
                    <span className="text-pink-400 font-mono text-sm w-8">
                      {String(chapter.chapter_order).padStart(2, '0')}
                    </span>
                  )}
                  <span className="font-medium text-neutral-200 group-hover:text-pink-300 transition-colors">
                    {chapter.title}
                  </span>
                </div>
                <span className="text-neutral-600 group-hover:text-neutral-400 transition-colors">
                  →
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
