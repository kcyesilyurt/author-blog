'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

import VerifiedBadge from '@/components/VerifiedBadge';

const publicLinks = [
  { href: '/#eserler', label: 'Eserler' },
  { href: '/etkinlikler', label: 'Etkinlikler' },
  { href: '/ben-kimim', label: 'Ben Kimim?' },
  { href: '/pano', label: 'Pano' },
  { href: '/iletisim', label: 'İletişim' },
];

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [profileIsAdmin, setProfileIsAdmin] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Övgü Deveci Safi';

  useEffect(() => {
    let cancelled = false;
    let requestSequence = 0;

    const syncUserAndProfile = async (nextUser: User | null) => {
      if (cancelled) return;
      const requestId = ++requestSequence;
      setUser(nextUser);
      setProfileIsAdmin(false);
      setAvatarUrl(nextUser?.user_metadata?.avatar_url ?? null);

      if (nextUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin, avatar_url')
          .eq('id', nextUser.id)
          .single();

        if (cancelled || requestId !== requestSequence) return;
        if (profile?.is_admin) {
          setProfileIsAdmin(true);
        }
        if (profile?.avatar_url) {
          setAvatarUrl(profile.avatar_url);
        }
      }
    };

    void supabase.auth.getUser().then(({ data }) => syncUserAndProfile(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      // Run profile queries after the auth callback completes to avoid blocking
      // Supabase's internal auth-state lock.
      window.setTimeout(() => void syncUserAndProfile(session?.user ?? null), 0);
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfileIsAdmin(false);
    setAvatarUrl(null);
    window.location.href = '/';
  };

  const isAdmin = profileIsAdmin;
  const displayName = user?.user_metadata?.first_name
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name ? user.user_metadata.last_name.charAt(0) + '.' : ''}`.trim()
    : user?.user_metadata?.display_name || user?.email;

  return (
    <nav className="sticky top-0 z-50 bg-[#0E0000]/90 backdrop-blur-md border-b border-[#64090C]/30">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-[#F8D794] hover:text-[#EFEACD] font-serif transition">
          {siteName}
        </Link>

        <div className="hidden lg:flex items-center gap-4">
          {publicLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[#EFEACD]/70 hover:text-[#F8D794] transition text-sm whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" className="text-[#F8D794] hover:text-[#EFEACD] transition text-sm border border-[#F8D794]/30 px-2 py-1 rounded">
              ⚙️ Admin Paneli
            </Link>
          )}
          {user ? (
            <>
              <Link href="/profile" className="text-[#EFEACD]/60 hover:text-[#F8D794] transition text-sm font-medium inline-flex items-center gap-2 group" title="Profilini Düzenle">
                {avatarUrl && (
                  <Image src={avatarUrl} alt="" width={24} height={24} className="w-6 h-6 rounded-full object-cover border border-[#64090C]/40 group-hover:border-[#F8D794] transition" />
                )}
                <span className="group-hover:text-[#F8D794] transition">{displayName}</span>
                {isAdmin && <VerifiedBadge />}
              </Link>
              <button onClick={handleLogout} className="text-[#EFEACD]/50 hover:text-[#EFEACD] text-sm transition">
                Çıkış Yap
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-[#EFEACD]/70 hover:text-[#F8D794] text-sm transition">
                Giriş Yap
              </Link>
              <Link href="/auth/signup" className="bg-[#9C0512] text-[#F8D794] px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-[#7a040e] transition">
                Kayıt Ol
              </Link>
            </>
          )}
        </div>

        <button
          aria-label="Menüyü Aç/Kapat"
          className="lg:hidden z-50 flex flex-col justify-center items-center w-10 h-10 space-y-1.5 focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className={`block w-6 h-0.5 bg-[#EFEACD]/70 transition-transform duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-[#EFEACD]/70 transition-opacity duration-300 ${menuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
          <span className={`block w-6 h-0.5 bg-[#EFEACD]/70 transition-transform duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </button>
      </div>

      {menuOpen && (
        <div className="lg:hidden fixed inset-0 bg-[#0E0000]/98 backdrop-blur-md z-40 flex flex-col justify-center items-center px-6 space-y-4 animate-in fade-in duration-200 overflow-y-auto">
          {publicLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-2xl font-medium text-[#EFEACD] hover:text-[#F8D794] transition py-1"
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" onClick={() => setMenuOpen(false)} className="text-2xl font-medium text-[#F8D794] hover:text-[#EFEACD] transition py-2">
              ⚙️ Admin Paneli
            </Link>
          )}
          {user ? (
            <>
              <Link href="/profile" onClick={() => setMenuOpen(false)} className="text-[#EFEACD] text-lg font-medium inline-flex items-center gap-2">
                {avatarUrl && (
                  <Image src={avatarUrl} alt="" width={32} height={32} className="w-8 h-8 rounded-full object-cover border border-[#64090C]/40" />
                )}
                <span>{displayName}</span>
                {isAdmin && <VerifiedBadge className="w-5 h-5 text-sky-400" />}
              </Link>
              <button onClick={() => { setMenuOpen(false); handleLogout(); }} className="text-2xl font-medium text-[#EFEACD]/50 hover:text-[#EFEACD] py-2 transition">
                Çıkış Yap
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="text-2xl font-medium text-[#EFEACD] hover:text-[#F8D794] py-2 transition">
                Giriş Yap
              </Link>
              <Link href="/auth/signup" onClick={() => setMenuOpen(false)} className="w-full max-w-xs bg-[#9C0512] text-[#F8D794] py-3 rounded-xl text-center text-lg font-medium hover:bg-[#7a040e] transition mt-4">
                Kayıt Ol
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
