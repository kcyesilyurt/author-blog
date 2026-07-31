'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import { banUser, unbanUser } from '../actions';
import { Profile } from '@/lib/types';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data as Profile[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleBan = async (user: Profile) => {
    const isCurrentlyBanned = user.is_banned;
    const actionText = isCurrentlyBanned ? 'yasağını kaldırmak' : 'yasaklamak';
    if (!window.confirm(`${user.display_name || 'Bu kullanıcıyı'} ${actionText} istediğinizden emin misiniz?`)) return;

    try {
      if (isCurrentlyBanned) {
        await unbanUser(user.id);
      } else {
        await banUser(user.id);
      }
      await fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Kullanıcı durumu güncellenemedi');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-medium text-white">Kullanıcı Yönetimi</h2>
          <p className="text-sm text-neutral-400">Kayıtlı kullanıcıları listeleyin, durumlarını kontrol edin veya yasaklayın</p>
        </div>
        <span className="text-sm bg-neutral-800 text-neutral-300 px-3 py-1 rounded-full border border-neutral-700">
          Toplam Kullanıcı: {users.length}
        </span>
      </div>

      {loading ? (
        <p className="text-neutral-500 text-sm italic">Kullanıcılar yükleniyor...</p>
      ) : users.length === 0 ? (
        <div className="text-center py-12 bg-neutral-900/40 rounded-xl border border-neutral-800">
          <p className="text-neutral-500">Henüz hiç kayıtlı kullanıcı yok.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u) => (
            <div
              key={u.id}
              className={`bg-neutral-900/60 rounded-xl p-5 border flex flex-col justify-between space-y-4 ${
                u.is_banned ? 'border-red-800/60 bg-red-950/10' : 'border-neutral-800'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-base">
                    {u.display_name || 'İsimsiz Kullanıcı'}
                  </span>
                  {u.is_banned ? (
                    <span className="text-xs bg-red-950 text-red-400 border border-red-800 px-2 py-0.5 rounded-full">
                      Yasaklı
                    </span>
                  ) : (
                    <span className="text-xs bg-green-950 text-green-400 border border-green-800 px-2 py-0.5 rounded-full">
                      Aktif
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500">Kayıt Tarihi: {formatDate(u.created_at)}</p>
              </div>

              <div className="pt-2 border-t border-neutral-800/80 flex justify-end">
                <button
                  onClick={() => handleToggleBan(u)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition ${
                    u.is_banned
                      ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
                      : 'bg-red-950/40 hover:bg-red-900/60 text-red-400 border-red-800/60'
                  }`}
                >
                  {u.is_banned ? 'Yasağı Kaldır' : 'Kullanıcıyı Yasakla'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
