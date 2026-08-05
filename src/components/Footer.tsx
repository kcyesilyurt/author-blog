import Link from 'next/link';

const footerLinks = [
  { href: '/#kitaplarim', label: 'Kitaplarım' },
  { href: '/#blog-yazilarim', label: 'Blog Yazılarım' },
  { href: '/#videolar', label: 'Videolar' },
  { href: '/etkinlikler', label: 'Etkinlikler' },
  { href: '/ben-kimim', label: 'Ben Kimim?' },
  { href: '/pano', label: 'Pano' },
  { href: '/iletisim', label: 'İletişim' },
];

export default function Footer() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Övgü Deveci Safi';
  const year = new Date().getFullYear();
  
  return (
    <footer className="bg-[#0E0000] border-t border-[#64090C]/20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="ornament-divider">✦</div>
        <nav aria-label="Alt menü" className="mb-6 flex flex-wrap justify-center gap-x-5 gap-y-2">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-[#EFEACD]/55 transition hover:text-[#F8D794]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-sm text-[#EFEACD]/40 text-center font-serif">
          © {year} {siteName}. Tüm hakları saklıdır.
        </p>
      </div>
    </footer>
  );
}
