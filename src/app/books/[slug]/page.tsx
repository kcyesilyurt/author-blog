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

  if (!book) return { title: 'Book Not Found' };
  
  return {
    title: book.title,
    description: book.description || `Read ${book.title}`,
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
    return new Date(dateStr).toLocaleDateString('en-US', {
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
          <div className="flex-shrink-0 w-64 aspect-[3/4] relative rounded-xl shadow-2xl overflow-hidden">
            <Image 
              src={book.cover_url} 
              alt={`Cover of ${book.title}`} 
              fill 
              className="object-cover"
              sizes="256px"
            />
          </div>
        )}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-100">{book.title}</h1>
          <p className="mt-4 text-lg text-zinc-400 leading-relaxed">
            {book.description}
          </p>
          <p className="text-sm text-zinc-500 mt-2">
            Published on {formatDate(book.created_at)}
          </p>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold text-zinc-100 mb-6">
          {isPostType ? 'Content' : 'Chapters'}
        </h2>
        
        {(!chapters || chapters.length === 0) ? (
          <p className="text-zinc-500">No chapters yet.</p>
        ) : (
          <div className="space-y-3">
            {chapters.map((chapter: Chapter) => (
              <Link 
                key={chapter.id} 
                href={`/books/${slug}/${chapter.slug}`}
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg px-5 py-4 flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-4">
                  {!isPostType && (
                    <span className="text-amber-500 font-mono text-sm w-8">
                      {String(chapter.chapter_order).padStart(2, '0')}
                    </span>
                  )}
                  <span className="font-medium text-zinc-200 group-hover:text-amber-400 transition-colors">
                    {chapter.title}
                  </span>
                </div>
                <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors">
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
