import { Inter, Lora } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const lora = Lora({ subsets: ['latin'], variable: '--font-lora' });

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME || 'Author Blog',
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'Stories and thoughts',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${lora.variable} font-sans bg-zinc-950 text-zinc-100 min-h-screen antialiased flex flex-col`}>
        <Navbar />
        <main className="flex-1 pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
