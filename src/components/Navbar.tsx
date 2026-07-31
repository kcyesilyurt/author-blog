'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: 'Books', href: '/books' },
    { name: 'About', href: '/about' },
  ];

  if (user) {
    navLinks.push({ name: 'Profile', href: '/profile' });
  } else {
    navLinks.push({ name: 'Sign In', href: '/auth/signin' });
  }

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur flex-none transition-colors duration-500 lg:z-50 lg:border-b lg:border-neutral-800/50 bg-black/80">
      <div className="max-w-6xl mx-auto">
        <div className="py-4 px-4 sm:px-6 lg:px-8 border-b border-neutral-800 lg:border-none flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 z-50">
            <span className="font-serif text-xl font-bold tracking-tight text-white hover:text-pink-300 transition-colors">
              Author Name
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'text-pink-400'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Mobile Navigation Toggle */}
          <button
            type="button"
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-pink-400 z-50 relative transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
          >
            <span className="sr-only">Open main menu</span>
            {isOpen ? (
              <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/95 backdrop-blur-md animate-in fade-in duration-200">
          <nav className="flex flex-col items-center justify-center h-full gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-2xl font-medium py-3 px-6 transition-colors ${
                  pathname === link.href
                    ? 'text-pink-400'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
