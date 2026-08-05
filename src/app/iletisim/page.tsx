import type { Metadata } from 'next';
import ContactForm from '@/components/ContactForm';
import PageHeader from '@/components/PageHeader';
import { absoluteSiteUrl, SOCIAL_IMAGE_PATH } from '@/lib/site';

export const metadata: Metadata = {
  title: 'İletişim',
  description: 'Soru, iş birliği ve okur mesajları için Övgü Deveci Safi ile iletişime geçin.',
  alternates: { canonical: '/iletisim' },
  openGraph: {
    title: 'İletişim | Övgü Deveci Safi',
    description: 'Soru, iş birliği ve okur mesajları için Övgü Deveci Safi ile iletişime geçin.',
    url: absoluteSiteUrl('/iletisim'),
    type: 'website',
    images: [{ url: SOCIAL_IMAGE_PATH, width: 1024, height: 682, alt: 'Övgü Deveci Safi' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'İletişim | Övgü Deveci Safi',
    description: 'Soru, iş birliği ve okur mesajları için Övgü Deveci Safi ile iletişime geçin.',
    images: [SOCIAL_IMAGE_PATH],
  },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <PageHeader
        title="İletişim"
        eyebrow="Bana Yaz"
        description="Soru, iş birliği veya sadece bir merhaba için aşağıdaki formdan bana ulaşabilirsin."
      />
      <ContactForm />
    </div>
  );
}
