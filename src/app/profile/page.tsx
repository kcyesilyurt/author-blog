'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { updateProfile } from './actions';
import {
  createAvatarUploadTicket,
  finalizePublicAvatar,
} from '../auth/actions';
import {
  AVATAR_IMAGE_MAX_BYTES,
  formatUploadLimit,
} from '@/lib/upload-limits';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push('/auth/login');
        return;
      }
      setUser(data.user);

      // Fetch profile from database
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .eq('id', data.user.id)
        .single();

      setFirstName(profile?.first_name || data.user.user_metadata?.first_name || '');
      setLastName(profile?.last_name || data.user.user_metadata?.last_name || '');
      setAvatarUrl(profile?.avatar_url || data.user.user_metadata?.avatar_url || '');
      setLoading(false);
    });
  }, [supabase, router]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.size > AVATAR_IMAGE_MAX_BYTES) {
      setMessage({
        type: 'error',
        text: `Profil fotoğrafı en fazla ${formatUploadLimit(AVATAR_IMAGE_MAX_BYTES)} olabilir.`,
      });
      e.target.value = '';
      return;
    }
    setUploadingAvatar(true);
    setMessage(null);
    try {
      const ticket = await createAvatarUploadTicket({ mime: file.type, size: file.size });
      const { error } = await supabase.storage
        .from('avatars')
        .uploadToSignedUrl(ticket.path, ticket.token, file, {
          contentType: file.type,
          cacheControl: '31536000',
        });
      if (error) throw new Error('Profil fotoğrafı Storage alanına yüklenemedi');

      const url = await finalizePublicAvatar(ticket.path);
      setAvatarUrl(url);
    } catch (err: unknown) {
      console.error(err);
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Profil fotoğrafı yüklenemedi.',
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);

      await updateProfile(formData);
      setMessage({ type: 'success', text: 'Profil bilgileriniz başarıyla güncellendi!' });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: unknown) {
      console.error(err);
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Profil güncellenirken bir hata oluştu.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center text-[#EFEACD]/60">
        Profil bilgileri yükleniyor...
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="glass-card bg-[#64090C]/10 rounded-2xl p-6 sm:p-8 border border-[#64090C]/30 shadow-xl shadow-black/20">
        <h1 className="text-2xl font-bold text-[#EFEACD] mb-2 text-center">Profil Düzenle</h1>
        <p className="text-[#EFEACD]/60 text-sm mb-8 text-center">İsminizi ve profil fotoğrafınızı özelleştirin</p>

        {message && (
          <div
            role={message.type === 'error' ? 'alert' : 'status'}
            aria-live="polite"
            className={`mb-6 p-4 rounded-xl text-sm text-center border ${
              message.type === 'success'
                ? 'bg-green-900/40 border-green-800/60 text-green-300'
                : 'bg-red-900/40 border-red-800/60 text-red-300'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload Section */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="relative group">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Profil Fotoğrafı"
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full object-cover border-2 border-[#F8D794]/60 shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-[#64090C]/20 border-2 border-[#64090C]/30 flex items-center justify-center text-3xl text-[#EFEACD]/40">
                  👤
                </div>
              )}
            </div>

            <label
              htmlFor="profile-avatar"
              className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-[#64090C]/30 bg-[#64090C]/20 px-4 py-2 text-sm font-medium text-[#EFEACD]/80 transition-colors hover:bg-[#64090C]/30"
            >
              {uploadingAvatar ? 'Fotoğraf Yükleniyor...' : 'Fotoğraf Değiştir'}
              <input
                id="profile-avatar"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
                className="hidden"
              />
            </label>
            <p className="text-xs text-[#EFEACD]/40">
              JPEG, PNG veya WebP · en fazla {formatUploadLimit(AVATAR_IMAGE_MAX_BYTES)}
            </p>
          </div>

          {/* User Details */}
          <div className="space-y-4 pt-2">
            <div>
              <label htmlFor="profile-email" className="mb-2 block text-sm font-medium text-[#EFEACD]/60">
                E-posta Adresi
              </label>
              <input
                id="profile-email"
                name="email"
                type="email"
                autoComplete="email"
                disabled
                value={user?.email || ''}
                className="min-h-12 w-full cursor-not-allowed rounded-lg border border-[#64090C]/30 bg-[#64090C]/10 px-4 py-3 text-base text-[#EFEACD]/40"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="profile-first-name" className="mb-2 block text-sm font-medium text-[#EFEACD]/60">
                  Ad
                </label>
                <input
                  id="profile-first-name"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  placeholder="Adınız"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="min-h-12 w-full rounded-lg border border-[#64090C]/30 bg-[#64090C]/20 px-4 py-3 text-base text-[#EFEACD] focus:border-[#F8D794] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="profile-last-name" className="mb-2 block text-sm font-medium text-[#EFEACD]/60">
                  Soyad
                </label>
                <input
                  id="profile-last-name"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  placeholder="Soyadınız"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="min-h-12 w-full rounded-lg border border-[#64090C]/30 bg-[#64090C]/20 px-4 py-3 text-base text-[#EFEACD] focus:border-[#F8D794] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={saving || uploadingAvatar}
              className="min-h-12 w-full rounded-lg bg-[#9C0512] px-4 py-3 text-base font-semibold text-[#EFEACD] transition-colors hover:bg-[#9C0512]/80 disabled:opacity-50"
            >
              {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
