import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Chapter } from '@/lib/types';
import ReaderLayout from '@/components/ReaderLayout';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ChapterNav from '@/components/ChapterNav';
import ReactionPicker from '@/components/ReactionPicker';
import CommentSection from '@/components/CommentSection';
import type { Metadata } from 'next';
import { PRIVATE_ROBOTS, SITE_NAME } from '@/lib/site';

type Props = {
  params: Promise<{ slug: string; chapterSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, chapterSlug } = await params;
  const supabase = await createClient();
  const now = new Date().toISOString();
  
  const { data: book } = await supabase
    .from('books')
    .select('id, title, cover_url')
    .eq('slug', slug)
    .in('status', ['published', 'scheduled'])
    .lte('published_at', now)
    .maybeSingle();
  if (!book) {
    return {
      title: 'Sayfa Bulunamadı',
      robots: PRIVATE_ROBOTS,
    };
  }
  
  const { data: chapter } = await supabase
    .from('chapters')
    .select('title')
    .eq('book_id', book.id)
    .eq('slug', chapterSlug)
    .in('status', ['published', 'scheduled'])
    .lte('published_at', now)
    .maybeSingle();
  if (!chapter) {
    return {
      title: 'Sayfa Bulunamadı',
      robots: PRIVATE_ROBOTS,
    };
  }

  const title = `${chapter.title} - ${book.title}`;
  const description = `${book.title} eserinden ${chapter.title} bölümünü oku.`;
  const canonical = `/books/${slug}/${chapterSlug}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: 'article',
      locale: 'tr_TR',
      siteName: SITE_NAME,
      url: canonical,
      title,
      description,
      authors: [SITE_NAME],
      images: book.cover_url
        ? [{ url: book.cover_url, alt: `${book.title} kapak görseli` }]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: book.cover_url ? [book.cover_url] : undefined,
    },
  };
}

export default async function ChapterPage({ params }: Props) {
  const { slug, chapterSlug } = await params;
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('slug', slug)
    .in('status', ['published', 'scheduled'])
    .lte('published_at', now)
    .maybeSingle();

  if (!book) notFound();

  const { data: chapters } = await supabase
    .from('chapters')
    .select('*')
    .eq('book_id', book.id)
    .in('status', ['published', 'scheduled'])
    .lte('published_at', now)
    .order('chapter_order', { ascending: true });

  if (!chapters || chapters.length === 0) notFound();

  const currentChapter = chapters.find((c: Chapter) => c.slug === chapterSlug);
  if (!currentChapter) notFound();

  return (
    <div>
      <div className="max-w-[680px] mx-auto px-4 sm:px-6 pt-8 pb-4">
        <nav className="text-sm text-neutral-500 flex items-center space-x-2 flex-wrap">
          <Link href="/" className="hover:text-pink-300 transition">Ana Sayfa</Link>
          <span>/</span>
          <Link href={`/books/${slug}`} className="hover:text-pink-300 transition">{book.title}</Link>
          <span>/</span>
          <span className="text-neutral-400 truncate max-w-[200px]">{currentChapter.title}</span>
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
