import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-neutral-800 bg-black py-12 mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <Link href="/" className="font-serif text-lg font-bold tracking-tight text-white hover:text-pink-300 transition-colors">
            Author Name
          </Link>
          <p className="mt-2 text-sm text-neutral-500">
            &copy; {new Date().getFullYear()} All rights reserved.
          </p>
        </div>
        
        <div className="flex gap-6">
          <Link href="/about" className="text-sm text-neutral-400 hover:text-white transition-colors">
            About
          </Link>
          <Link href="/books" className="text-sm text-neutral-400 hover:text-white transition-colors">
            Books
          </Link>
          <a href="#" className="text-sm text-neutral-400 hover:text-white transition-colors">
            Twitter
          </a>
          <a href="#" className="text-sm text-neutral-400 hover:text-white transition-colors">
            Instagram
          </a>
        </div>
      </div>
    </footer>
  );
}
