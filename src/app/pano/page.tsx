import PanoBoard from '@/components/PanoBoard';
import type { Metadata } from 'next';
import { SITE_NAME, SOCIAL_IMAGE_PATH } from '@/lib/site';

const description = 'Okurlarla sohbet ve düşünce panosu';

export const metadata: Metadata = {
  title: 'Pano',
  description,
  alternates: {
    canonical: '/pano',
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: SITE_NAME,
    url: '/pano',
    title: `Pano | ${SITE_NAME}`,
    description,
    images: [{ url: SOCIAL_IMAGE_PATH, width: 1024, height: 682, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Pano | ${SITE_NAME}`,
    description,
    images: [SOCIAL_IMAGE_PATH],
  },
};

export default function PanoPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-serif font-bold gold-text mb-4">Pano</h1>
        <div className="ornament-divider">✦</div>
        <p className="text-[#EFEACD]/50 text-lg">
          Burada okurlarla sohbet edebilir, düşüncelerinizi paylaşabilir ve edebiyat üzerine tartışabilirsiniz.
        </p>
      </div>

      <PanoBoard />
    </div>
  );
}
