'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const supabase = createClient();
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Author Blog';

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/';
  };

  return (
    <nav className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-amber-500 hover:text-amber-400 transition">
          {siteName}
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-zinc-300 hover:text-zinc-100 transition text-sm">
            Books
          </Link>
          {user ? (
            <>
              <span className="text-zinc-400 text-sm">{user.email}</span>
              <button onClick={handleLogout} className="text-zinc-400 hover:text-zinc-100 text-sm transition">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-zinc-300 hover:text-zinc-100 text-sm transition">
                Sign In
              </Link>
              <Link href="/auth/signup" className="bg-amber-500 text-zinc-950 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-amber-400 transition">
                Sign Up
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden flex flex-col justify-center items-center w-8 h-8 space-y-1.5"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className={`block w-6 h-0.5 bg-zinc-300 transition-transform duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-zinc-300 transition-opacity duration-300 ${menuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
          <span className={`block w-6 h-0.5 bg-zinc-300 transition-transform duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden absolute w-full bg-zinc-900 border-b border-zinc-800">
          <div className="flex flex-col px-4 py-3 space-y-4">
            <Link href="/" className="text-zinc-300 hover:text-zinc-100 transition text-sm py-2">
              Books
            </Link>
            {user ? (
              <>
                <span className="text-zinc-400 text-sm py-2">{user.email}</span>
                <button onClick={handleLogout} className="text-left text-zinc-400 hover:text-zinc-100 text-sm py-2 transition">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-zinc-300 hover:text-zinc-100 text-sm py-2 transition">
                  Sign In
                </Link>
                <Link href="/auth/signup" className="bg-amber-500 text-zinc-950 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-400 transition text-center mt-2">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
