export default function Footer() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Övgü Deveci Safi';
  const year = new Date().getFullYear();
  
  return (
    <footer className="bg-neutral-900 border-t border-neutral-800">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-sm text-neutral-500 text-center">
          © {year} {siteName}. Tüm hakları saklıdır.
        </p>
      </div>
    </footer>
  );
}
