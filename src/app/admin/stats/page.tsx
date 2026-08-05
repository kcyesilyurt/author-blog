'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AdminStatsPage() {
  const [stats, setStats] = useState({
    booksCount: 0,
    chaptersCount: 0,
    commentsCount: 0,
    reactionsCount: 0,
    usersCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);

      const [
        { count: booksCount },
        { count: chaptersCount },
        { count: commentsCount },
        { count: reactionsCount },
        { count: usersCount },
      ] = await Promise.all([
        supabase.from('books').select('*', { count: 'exact', head: true }),
        supabase.from('chapters').select('*', { count: 'exact', head: true }),
        supabase.from('comments').select('*', { count: 'exact', head: true }),
        supabase.from('reactions').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        booksCount: booksCount || 0,
        chaptersCount: chaptersCount || 0,
        commentsCount: commentsCount || 0,
        reactionsCount: reactionsCount || 0,
        usersCount: usersCount || 0,
      });

      setLoading(false);
    };

    fetchStats();
  }, [supabase]);

  const cards = [
    { title: 'Toplam Eser', value: stats.booksCount, icon: '📚', desc: 'Kitap ve blog yazıları' },
    { title: 'Toplam Bölüm', value: stats.chaptersCount, icon: '📄', desc: 'Yayınlanan metin bölümleri' },
    { title: 'Okuyucu Yorumları', value: stats.commentsCount, icon: '💬', desc: 'Misafir ve üye yorumları' },
    { title: 'Toplam Tepkiler', value: stats.reactionsCount, icon: '❤️', desc: 'Beğeni, kalp ve yer imleri' },
    { title: 'Kayıtlı Üyeler', value: stats.usersCount, icon: '👥', desc: 'Sisteme kayıtlı profiller' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-medium text-white">İstatistikler ve Analizler</h2>
        <p className="text-sm text-neutral-400">Sitenizin genel etkileşim ve içerik sayıları</p>
      </div>

      {loading ? (
        <p className="text-neutral-500 text-sm italic">İstatistikler hesaplanıyor...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((c, i) => (
            <div key={i} className="glass-card bg-neutral-900/60 rounded-xl p-6 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl">{c.icon}</span>
                <span className="text-3xl font-bold text-pink-400">{c.value}</span>
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">{c.title}</h3>
                <p className="text-xs text-neutral-400 mt-1">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
