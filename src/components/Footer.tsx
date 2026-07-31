export default function Footer() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Author Blog';
  const year = new Date().getFullYear();
  
  return (
    <footer className="bg-zinc-900 border-t border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-sm text-zinc-500 text-center">
          © {year} {siteName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
