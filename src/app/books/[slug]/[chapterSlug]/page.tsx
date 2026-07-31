import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Book, Chapter } from '@/lib/types';
import ReaderLayout from '@/components/ReaderLayout';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ChapterNav from '@/components/ChapterNav';
import ReactionPicker from '@/components/ReactionPicker';
import CommentSection from '@/components/CommentSection';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ slug: string; chapterSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, chapterSlug } = await params;
  const supabase = await createClient();
  
  const { data: book } = await supabase.from('books').select('id, title').eq('slug', slug).single();
  if (!book) return { title: 'Not Found' };
  
  const { data: chapter } = await supabase.from('chapters').select('title').eq('book_id', book.id).eq('slug', chapterSlug).single();
  if (!chapter) return { title: 'Not Found' };
  
  return {
    title: `${chapter.title} - ${book.title}`,
  };
}

export default async function ChapterPage({ params }: Props) {
  const { slug, chapterSlug } = await params;
  const supabase = await createClient();

  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!book) notFound();

  const { data: chapters } = await supabase
    .from('chapters')
    .select('*')
    .eq('book_id', book.id)
    .order('chapter_order', { ascending: true });

  if (!chapters || chapters.length === 0) notFound();

  const currentChapter = chapters.find((c: Chapter) => c.slug === chapterSlug);
  if (!currentChapter) notFound();

  return (
    <div>
      <div className="max-w-[680px] mx-auto px-4 sm:px-6 pt-8 pb-4">
        <nav className="text-sm text-neutral-500 flex items-center space-x-2">
          <Link href="/" className="hover:text-pink-300 transition">Home</Link>
          <span>/</span>
          <Link href={`/books/${slug}`} className="hover:text-pink-300 transition">{book.title}</Link>
          <span>/</span>
          <span className="text-neutral-400">{currentChapter.title}</span>
        </nav>
      </div>

      <ReaderLayout>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8 font-sans">
          {currentChapter.title}
        </h1>
        <MarkdownRenderer content={currentChapter.content} />
      </ReaderLayout>

      <div className="max-w-[680px] mx-auto px-4 sm:px-6 pb-16 space-y-12">
        <ReactionPicker chapterId={currentChapter.id} />
        <ChapterNav 
          bookSlug={slug} 
          chapters={chapters} 
          currentChapterId={currentChapter.id} 
        />
        <CommentSection chapterId={currentChapter.id} />
      </div>
    </div>
  );
}
