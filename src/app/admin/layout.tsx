import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getAdminContext } from '@/lib/auth/admin';
import { PRIVATE_ROBOTS } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Yönetim Paneli',
  robots: PRIVATE_ROBOTS,
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = await getAdminContext();

  if (!user) {
    redirect('/auth/login?next=/admin');
  }

  if (!isAdmin) {
    redirect('/');
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-neutral-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Yönetim Paneli</h1>
          <p className="text-sm text-neutral-400 mt-1">İçerikleri, etkinlikleri, mesajları ve topluluğu yönetin</p>
        </div>

        <nav className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          <Link
            href="/admin"
            className="px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-sm font-medium text-neutral-200 hover:text-pink-400 hover:border-pink-400/30 transition whitespace-nowrap"
          >
            📚 İçerikler
          </Link>
          <Link
            href="/admin/comments"
            className="px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-sm font-medium text-neutral-200 hover:text-pink-400 hover:border-pink-400/30 transition whitespace-nowrap"
          >
            💬 Yorumlar
          </Link>
          <Link
            href="/admin/events"
            className="px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-sm font-medium text-neutral-200 hover:text-pink-400 hover:border-pink-400/30 transition whitespace-nowrap"
          >
            📅 Etkinlikler
          </Link>
          <Link
            href="/admin/messages"
            className="px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-sm font-medium text-neutral-200 hover:text-pink-400 hover:border-pink-400/30 transition whitespace-nowrap"
          >
            ✉️ Mesajlar
          </Link>
          <Link
            href="/admin/users"
            className="px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-sm font-medium text-neutral-200 hover:text-pink-400 hover:border-pink-400/30 transition whitespace-nowrap"
          >
            👥 Kullanıcılar
          </Link>
          <Link
            href="/admin/stats"
            className="px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-sm font-medium text-neutral-200 hover:text-pink-400 hover:border-pink-400/30 transition whitespace-nowrap"
          >
            📊 İstatistikler
          </Link>
        </nav>
      </div>

      {children}
    </div>
  );
}
