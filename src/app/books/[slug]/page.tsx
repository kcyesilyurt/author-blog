import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ContinueReadingLink from '@/components/ContinueReadingLink';
import type { PublicChapterListItem } from '@/lib/types';
import type { Metadata } from 'next';
import { PRIVATE_ROBOTS, SITE_NAME } from '@/lib/site';
import {
  getPublicBook,
  getPublicChapterList,
  getPublicWorks,
} from '@/lib/publications';

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const works = await getPublicWorks();
  return works.map((work) => ({ slug: work.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const book = await getPublicBook(slug);

  if (!book) {
    return {
      title: 'Eser Bulunamadı',
      robots: PRIVATE_ROBOTS,
    };
  }

  const canonical = `/books/${slug}`;
  const description = book.description || `${book.title} eserini oku`;
  const images = book.cover_url
    ? [{ url: book.cover_url, alt: `${book.title} kapak görseli` }]
    : undefined;

  return {
    title: book.title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: 'website',
      locale: 'tr_TR',
      siteName: SITE_NAME,
      url: canonical,
      title: book.title,
      description,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: book.title,
      description,
      images: book.cover_url ? [book.cover_url] : undefined,
    },
  };
}

export default async function BookPage({ params }: Props) {
  const { slug } = await params;
  const book = await getPublicBook(slug);

  if (!book) {
    notFound();
  }

  const chapters = await getPublicChapterList(book.id);

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
          <div className="flex-shrink-0 w-56 sm:w-64 aspect-[3/4] relative rounded-xl shadow-2xl overflow-hidden border border-[#64090C]/30">
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
          <h1 className="text-3xl sm:text-4xl font-bold text-[#EFEACD]">{book.title}</h1>
          <p className="mt-4 text-base sm:text-lg text-[#EFEACD]/70 leading-relaxed">
            {book.description}
          </p>
          <p className="text-sm text-[#EFEACD]/40 mt-3">
            Yayınlanma tarihi: {formatDate(book.published_at || book.created_at)}
          </p>
        </div>
      </div>

      <div id="bolumler" className="mt-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-[#EFEACD] mb-6">
          {isPostType ? 'İçerik' : 'Bölümler'}
        </h2>

        {chapters.length > 0 && (
          <ContinueReadingLink
            bookId={book.id}
            bookSlug={book.slug}
            chapters={chapters}
          />
        )}
        
        {chapters.length === 0 ? (
          <p className="text-[#EFEACD]/40">Henüz bölüm bulunmuyor.</p>
        ) : (
          <div className="space-y-3">
            {chapters.map((chapter: PublicChapterListItem) => (
              <Link 
                key={chapter.id} 
                href={`/books/${slug}/${chapter.slug}`}
                className="bg-[#64090C]/10 hover:bg-[#64090C]/20 border border-[#64090C]/30 hover:border-[#F8D794]/20 rounded-lg px-5 py-4 flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-4">
                  {!isPostType && (
                    <span className="text-[#F8D794] font-mono text-sm w-8">
                      {String(chapter.chapter_order).padStart(2, '0')}
                    </span>
                  )}
                  <span className="font-medium text-[#EFEACD]/80 group-hover:text-[#F8D794] transition-colors">
                    {chapter.title}
                  </span>
                </div>
                <span className="text-[#EFEACD]/30 group-hover:text-[#EFEACD]/60 transition-colors">
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
