import BookCard from '@/components/BookCard';
import type { Book } from '@/lib/types';
import Image from 'next/image';
import type { Metadata } from 'next';
import { SITE_DESCRIPTION, SITE_NAME, SOCIAL_IMAGE_PATH } from '@/lib/site';
import YouTubeEmbed from '@/components/YouTubeEmbed';
import { getPublicWorks } from '@/lib/publications';

export const revalidate = 60;

const videos = [
  { videoId: 'rv3-asOqQNY', startSeconds: 381 },
  { videoId: 'vr1rmQZrf8s', startSeconds: 88 },
  { videoId: 'ohStFhP_tzI', startSeconds: 92 },
  { videoId: 'XeAoRUkWWYA', startSeconds: 32 },
];

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: SITE_NAME,
    url: '/',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [{ url: SOCIAL_IMAGE_PATH, width: 1024, height: 682, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [SOCIAL_IMAGE_PATH],
  },
};

function WorkSection({
  id,
  title,
  works,
  emptyMessage,
  featured = false,
}: {
  id?: string;
  title: string;
  works: Book[];
  emptyMessage: string;
  featured?: boolean;
}) {
  return (
    <section id={id} className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-serif font-bold gold-text">{title}</h2>
        <div className="ornament-divider">✦</div>
      </div>

      {works.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-[#EFEACD]/40 font-serif italic">{emptyMessage}</p>
        </div>
      ) : (
        <div
          className={
            featured
              ? 'max-w-sm mx-auto'
              : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          }
        >
          {works.map((work) => (
            <BookCard key={work.id} book={work} />
          ))}
        </div>
      )}
    </section>
  );
}

export default async function HomePage() {
  const works = await getPublicWorks();
  const latestWork = works[0] ? [works[0]] : [];
  const bookWorks = works.filter((work) => work.type === 'book');
  const blogPosts = works.filter((work) => work.type === 'post');

  return (
    <div className="-mt-16">
      {/* ===== HERO SECTION ===== */}
      <section className="hero-section">
        <Image
          src="/images/author/hero-forest.jpg"
          alt="Övgü Deveci Safi"
          fill
          preload
          sizes="100vw"
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
        <div className="hero-content px-4">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-bold gold-shimmer tracking-tight fade-in-up">
            {SITE_NAME}
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-[#EFEACD]/70 max-w-lg mx-auto font-serif italic fade-in-up-delay-1">
            {SITE_DESCRIPTION}
          </p>
          <div className="mt-8 flex gap-4 justify-center fade-in-up-delay-2">
            <a href="#eserler" className="bg-[#9C0512] text-[#F8D794] px-8 py-3 rounded-lg font-medium hover:bg-[#7a040e] transition-all hover:shadow-lg hover:shadow-[#9C0512]/20">
              Eserleri Keşfet
            </a>
            <a href="/pano" className="border border-[#F8D794]/30 text-[#F8D794] px-8 py-3 rounded-lg font-medium hover:bg-[#F8D794]/10 transition-all">
              Pano
            </a>
          </div>
        </div>
      </section>

      <WorkSection
        id="eserler"
        title="En Son Eklenen"
        works={latestWork}
        emptyMessage="Henüz yayınlanmış eser bulunmuyor."
        featured
      />

      <WorkSection
        id="kitaplarim"
        title="Kitaplarım"
        works={bookWorks}
        emptyMessage="Henüz yayınlanmış kitap bulunmuyor."
      />

      <WorkSection
        id="blog-yazilarim"
        title="Blog Yazılarım"
        works={blogPosts}
        emptyMessage="Henüz yayınlanmış blog yazısı bulunmuyor."
      />

      <section id="videolar" className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="mb-10 text-center">
          <h2 className="gold-text font-serif text-3xl font-bold sm:text-4xl">Videolar</h2>
          <div className="ornament-divider">✦</div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {videos.map((video, index) => (
            <YouTubeEmbed
              key={video.videoId}
              videoId={video.videoId}
              startSeconds={video.startSeconds}
              title={`Övgü Deveci Safi videosu ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ===== PARALLAX PHOTO BAND ===== */}
      <section
        className="parallax-band"
        style={{ backgroundImage: 'url(/images/author/pirate-chest.jpg)' }}
      >
        <div className="relative z-10 h-full flex items-center justify-center">
          <p className="text-2xl sm:text-3xl md:text-4xl font-serif italic gold-text text-center px-4">
            “Kelimelerin büyüsüne kapılmaya hazır mısın?”
          </p>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-20 text-center px-4">
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#EFEACD] mb-4">Okur Panosuna Katıl</h2>
        <p className="text-[#EFEACD]/50 max-w-md mx-auto mb-8">
          Diğer okurlarla sohbet et, düşüncelerini paylaş.
        </p>
        <a href="/pano" className="inline-block bg-[#9C0512] text-[#F8D794] px-8 py-3 rounded-lg font-medium hover:bg-[#7a040e] transition-all hover:shadow-lg hover:shadow-[#9C0512]/20">
          Panoya Git
        </a>
      </section>
    </div>
  );
}
