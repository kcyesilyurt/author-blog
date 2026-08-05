import { notFound } from 'next/navigation';
import Link from 'next/link';
import ReaderLayout from '@/components/ReaderLayout';
import ReaderExperience from '@/components/ReaderExperience';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ChapterNav from '@/components/ChapterNav';
import ReactionPicker from '@/components/ReactionPicker';
import CommentSection from '@/components/CommentSection';
import type { Metadata } from 'next';
import { PRIVATE_ROBOTS, SITE_NAME } from '@/lib/site';
import {
  getPublicBook,
  getPublicChapter,
  getPublicChapterList,
  getPublicChapterRoutes,
  getPublicWorks,
} from '@/lib/publications';

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string; chapterSlug: string }>;
};

export async function generateStaticParams() {
  const [works, chapters] = await Promise.all([
    getPublicWorks(),
    getPublicChapterRoutes(),
  ]);
  const workSlugs = new Map(works.map((work) => [work.id, work.slug]));

  return chapters.flatMap((chapter) => {
    const slug = workSlugs.get(chapter.book_id);
    return slug ? [{ slug, chapterSlug: chapter.slug }] : [];
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, chapterSlug } = await params;
  const book = await getPublicBook(slug);
  if (!book) {
    return {
      title: 'Sayfa Bulunamadı',
      robots: PRIVATE_ROBOTS,
    };
  }
  
  const chapter = await getPublicChapter(book.id, chapterSlug);
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
  const book = await getPublicBook(slug);

  if (!book) notFound();

  const [currentChapter, chapters] = await Promise.all([
    getPublicChapter(book.id, chapterSlug),
    getPublicChapterList(book.id),
  ]);
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

      <ReaderExperience
        key={currentChapter.id}
        book={{ id: book.id, slug: book.slug, title: book.title }}
        chapter={{
          id: currentChapter.id,
          slug: currentChapter.slug,
          title: currentChapter.title,
        }}
        chapters={chapters}
      >
        <ReaderLayout>
          <h1 className="mb-8 font-sans text-3xl font-bold text-white sm:text-4xl">
            {currentChapter.title}
          </h1>
          <MarkdownRenderer content={currentChapter.content} />
        </ReaderLayout>
      </ReaderExperience>

      <div className="mx-auto max-w-[680px] space-y-12 px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-6 md:pb-16">
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
