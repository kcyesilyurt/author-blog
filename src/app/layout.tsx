import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { Metadata, Viewport } from 'next';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, SOCIAL_IMAGE_PATH } from '@/lib/site';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const viewport: Viewport = {
  themeColor: '#0E0000',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: SOCIAL_IMAGE_PATH,
        width: 1024,
        height: 682,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [SOCIAL_IMAGE_PATH],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="dark">
      <body className={`${inter.variable} ${playfair.variable} font-sans bg-[#0E0000] text-[#EFEACD] min-h-screen antialiased flex flex-col`}>
        <Navbar />
        <main className="flex-1 pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
