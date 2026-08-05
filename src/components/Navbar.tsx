'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

import VerifiedBadge from '@/components/VerifiedBadge';
import styles from '@/components/Navbar.module.css';

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
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLElement>(null);
  const menuViewportRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!menuOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    const backgroundStates: Array<{
      element: HTMLElement;
      inert: boolean;
      ariaHidden: string | null;
    }> = [];
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();

      for (const element of Array.from(document.body.children)) {
        if (!(element instanceof HTMLElement)) continue;
        if (element === menuViewportRef.current || element.tagName === 'SCRIPT') continue;

        backgroundStates.push({
          element,
          inert: element.inert,
          ariaHidden: element.getAttribute('aria-hidden'),
        });
        element.inert = true;
        element.setAttribute('aria-hidden', 'true');
      }
    });

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMenuOpen(false);
      window.requestAnimationFrame(() => menuButtonRef.current?.focus());
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
      for (const { element, inert, ariaHidden } of backgroundStates) {
        element.inert = inert;
        if (ariaHidden === null) element.removeAttribute('aria-hidden');
        else element.setAttribute('aria-hidden', ariaHidden);
      }
    };
  }, [menuOpen]);

  useEffect(() => {
    const closeOnHistoryNavigation = () => setMenuOpen(false);

    window.addEventListener('popstate', closeOnHistoryNavigation);
    window.addEventListener('hashchange', closeOnHistoryNavigation);
    return () => {
      window.removeEventListener('popstate', closeOnHistoryNavigation);
      window.removeEventListener('hashchange', closeOnHistoryNavigation);
    };
  }, []);

  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 64rem)');
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setMenuOpen(false);
    };

    desktopQuery.addEventListener('change', closeOnDesktop);
    return () => desktopQuery.removeEventListener('change', closeOnDesktop);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
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

  const closeMenu = (restoreFocus = false) => {
    setMenuOpen(false);
    if (restoreFocus) {
      window.requestAnimationFrame(() => menuButtonRef.current?.focus());
    }
  };

  const keepFocusInsideMenu = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Tab') return;

    const focusableElements = menuPanelRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])'
    );
    if (!focusableElements?.length) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-[#64090C]/30 bg-[#0E0000]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link
            href="/"
            className="min-w-0 truncate pr-3 font-serif text-xl font-bold text-[#F8D794] transition hover:text-[#EFEACD]"
          >
            {siteName}
          </Link>

          <div className="hidden items-center gap-4 lg:flex">
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap text-sm text-[#EFEACD]/70 transition hover:text-[#F8D794]"
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className="rounded border border-[#F8D794]/30 px-2 py-1 text-sm text-[#F8D794] transition hover:text-[#EFEACD]"
              >
                ⚙️ Admin Paneli
              </Link>
            )}
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="group inline-flex items-center gap-2 text-sm font-medium text-[#EFEACD]/60 transition hover:text-[#F8D794]"
                  title="Profilini Düzenle"
                >
                  {avatarUrl && (
                    <Image
                      src={avatarUrl}
                      alt=""
                      width={24}
                      height={24}
                      className="h-6 w-6 rounded-full border border-[#64090C]/40 object-cover transition group-hover:border-[#F8D794]"
                    />
                  )}
                  <span className="transition group-hover:text-[#F8D794]">{displayName}</span>
                  {isAdmin && <VerifiedBadge />}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-sm text-[#EFEACD]/50 transition hover:text-[#EFEACD]"
                >
                  Çıkış Yap
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm text-[#EFEACD]/70 transition hover:text-[#F8D794]"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/auth/signup"
                  className="rounded-lg bg-[#9C0512] px-4 py-1.5 text-sm font-medium text-[#F8D794] transition hover:bg-[#7a040e]"
                >
                  Kayıt Ol
                </Link>
              </>
            )}
          </div>

          <button
            ref={menuButtonRef}
            type="button"
            aria-label={menuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            className="relative z-10 flex h-11 w-11 shrink-0 flex-col items-center justify-center space-y-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8D794] lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span
              aria-hidden="true"
              className={`block h-0.5 w-6 bg-[#EFEACD]/80 transition-transform duration-200 motion-reduce:transition-none ${menuOpen ? 'translate-y-2 rotate-45' : ''}`}
            />
            <span
              aria-hidden="true"
              className={`block h-0.5 w-6 bg-[#EFEACD]/80 transition-opacity duration-200 motion-reduce:transition-none ${menuOpen ? 'opacity-0' : 'opacity-100'}`}
            />
            <span
              aria-hidden="true"
              className={`block h-0.5 w-6 bg-[#EFEACD]/80 transition-transform duration-200 motion-reduce:transition-none ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`}
            />
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div ref={menuViewportRef} className={styles.viewport}>
          <button
            type="button"
            tabIndex={-1}
            aria-label="Menüyü kapat"
            className={styles.backdrop}
            onClick={() => closeMenu(true)}
          />

          <aside
            ref={menuPanelRef}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-navigation-title"
            className={`${styles.drawer} flex flex-col border-l border-[#F8D794]/15 bg-[#0E0000] shadow-2xl shadow-black/60`}
            onKeyDown={keepFocusInsideMenu}
          >
            <div className={`${styles.header} flex shrink-0 items-center justify-between gap-4 border-b border-[#64090C]/35 px-5 pb-4`}>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F8D794]/55">
                  Menü
                </p>
                <p
                  id="mobile-navigation-title"
                  className="mt-1 truncate font-serif text-xl font-bold text-[#F8D794]"
                >
                  {siteName}
                </p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Menüyü kapat"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#F8D794]/15 text-[#EFEACD]/75 transition hover:border-[#F8D794]/35 hover:text-[#F8D794] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8D794]"
                onClick={() => closeMenu(true)}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-7 w-7"
                >
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <nav
              aria-label="Mobil ana menü"
              className={`${styles.menuScroll} min-h-0 flex-1 overflow-y-auto px-4 pt-4`}
            >
              <div className="space-y-2">
                {publicLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => closeMenu()}
                    className="flex min-h-12 w-full items-center justify-between rounded-xl border border-transparent px-4 py-3 text-lg font-medium text-[#EFEACD] transition hover:border-[#F8D794]/15 hover:bg-[#64090C]/20 hover:text-[#F8D794] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8D794]"
                  >
                    <span>{link.label}</span>
                    <span aria-hidden="true" className="text-[#F8D794]/35">→</span>
                  </Link>
                ))}

                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => closeMenu()}
                    className="flex min-h-12 w-full items-center rounded-xl border border-[#F8D794]/15 bg-[#64090C]/15 px-4 py-3 text-base font-medium text-[#F8D794] transition hover:bg-[#64090C]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8D794]"
                  >
                    ⚙️ Admin Paneli
                  </Link>
                )}
              </div>

              <div className="mt-6 border-t border-[#64090C]/35 pt-6">
                <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#EFEACD]/35">
                  Hesabım
                </p>

                {user ? (
                  <div className="space-y-3">
                    <Link
                      href="/profile"
                      onClick={() => closeMenu()}
                      className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-[#F8D794]/10 bg-[#64090C]/10 px-4 py-3 text-[#EFEACD] transition hover:border-[#F8D794]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8D794]"
                    >
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt=""
                          width={40}
                          height={40}
                          className="h-10 w-10 shrink-0 rounded-full border border-[#F8D794]/20 object-cover"
                        />
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#64090C]/40 font-serif text-lg font-bold text-[#F8D794]">
                          {displayName?.charAt(0).toLocaleUpperCase('tr-TR') || 'O'}
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate font-medium">{displayName}</span>
                      {isAdmin && <VerifiedBadge className="h-5 w-5 shrink-0 text-sky-400" />}
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="min-h-12 w-full rounded-xl border border-[#EFEACD]/10 px-4 py-3 text-left font-medium text-[#EFEACD]/60 transition hover:border-[#EFEACD]/20 hover:text-[#EFEACD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8D794]"
                    >
                      Çıkış Yap
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link
                      href="/auth/login"
                      onClick={() => closeMenu()}
                      className="flex min-h-12 w-full items-center justify-center rounded-xl border border-[#F8D794]/20 px-4 py-3 text-base font-medium text-[#EFEACD] transition hover:border-[#F8D794]/40 hover:text-[#F8D794] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8D794]"
                    >
                      Giriş Yap
                    </Link>
                    <Link
                      href="/auth/signup"
                      onClick={() => closeMenu()}
                      className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#9C0512] px-4 py-3 text-base font-semibold text-[#F8D794] transition hover:bg-[#7a040e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8D794]"
                    >
                      Kayıt Ol
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
