import type { Metadata } from 'next';
import FanArtGallery from '@/components/FanArtGallery';
import { SITE_NAME, SOCIAL_IMAGE_PATH } from '@/lib/site';

export const runtime = 'nodejs';
export const maxDuration = 60;

const description = 'Okurların yazar ve eserleri için hazırladığı, moderasyonlu fan art galerisi';

export const metadata: Metadata = {
  title: 'Fan Art',
  description,
  alternates: { canonical: '/fan-art' },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: SITE_NAME,
    url: '/fan-art',
    title: `Fan Art | ${SITE_NAME}`,
    description,
    images: [{ url: SOCIAL_IMAGE_PATH, width: 1024, height: 682, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Fan Art | ${SITE_NAME}`,
    description,
    images: [SOCIAL_IMAGE_PATH],
  },
};

export default function FanArtPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-12 text-center">
        <h1 className="gold-text font-serif text-4xl font-bold">Fan Art</h1>
        <div className="ornament-divider">✦</div>
        <p className="mx-auto max-w-2xl text-lg leading-relaxed text-[#EFEACD]/50">
          Okurların hikâyelerden ve karakterlerden ilhamla ürettiği çalışmalar.
        </p>
      </header>
      <FanArtGallery />
    </div>
  );
}
