'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const supabase = createClient();
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Övgü Deveci Safi';

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
    <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-neutral-800">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-pink-400 hover:text-pink-300 transition">
          {siteName}
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-neutral-300 hover:text-white transition text-sm">
            Eserler
          </Link>
          {user ? (
            <>
              <span className="text-neutral-400 text-sm">{user.email}</span>
              <button onClick={handleLogout} className="text-neutral-400 hover:text-white text-sm transition">
                Çıkış Yap
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-neutral-300 hover:text-white text-sm transition">
                Giriş Yap
              </Link>
              <Link href="/auth/signup" className="bg-pink-400 text-black px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-pink-300 transition">
                Kayıt Ol
              </Link>
            </>
          )}
        </div>

        <button
          aria-label="Menüyü Aç/Kapat"
          className="md:hidden z-50 flex flex-col justify-center items-center w-10 h-10 space-y-1.5 focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className={`block w-6 h-0.5 bg-neutral-300 transition-transform duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-neutral-300 transition-opacity duration-300 ${menuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
          <span className={`block w-6 h-0.5 bg-neutral-300 transition-transform duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/95 backdrop-blur-md z-40 flex flex-col justify-center items-center px-6 space-y-6 animate-in fade-in duration-200">
          <Link href="/" onClick={() => setMenuOpen(false)} className="text-2xl font-medium text-neutral-200 hover:text-pink-300 transition py-2">
            Eserler
          </Link>
          {user ? (
            <>
              <span className="text-neutral-400 text-base">{user.email}</span>
              <button onClick={() => { setMenuOpen(false); handleLogout(); }} className="text-2xl font-medium text-neutral-400 hover:text-white py-2 transition">
                Çıkış Yap
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="text-2xl font-medium text-neutral-200 hover:text-white py-2 transition">
                Giriş Yap
              </Link>
              <Link href="/auth/signup" onClick={() => setMenuOpen(false)} className="w-full max-w-xs bg-pink-400 text-black py-3 rounded-xl text-center text-lg font-medium hover:bg-pink-300 transition mt-4">
                Kayıt Ol
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
