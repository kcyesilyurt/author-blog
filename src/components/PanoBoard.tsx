'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { timeAgo } from '@/lib/utils';
import type { PanoMessage } from '@/lib/types';
import VerifiedBadge from '@/components/VerifiedBadge';
import { deletePanoMessage } from '@/app/admin/actions';
import {
  getCommunityViewerState,
  listPanoMessages,
  submitPanoMessage,
} from '@/app/community/actions';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function PanoBoard() {
  const [messages, setMessages] = useState<PanoMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [guestName, setGuestName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      setMessages(await listPanoMessages());
    } catch {
      setErrorMessage('Pano mesajları yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void fetchMessages(), 0);
    void getCommunityViewerState()
      .then((viewer) => {
        setIsAuthenticated(viewer.isAuthenticated);
        setIsBanned(viewer.isBanned);
        setIsAdmin(viewer.isAdmin);
      })
      .catch(() => {
        setIsAuthenticated(false);
        setIsBanned(false);
        setIsAdmin(false);
      });
    return () => window.clearTimeout(timeout);
  }, [fetchMessages]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu pano mesajını silmek istediğinize emin misiniz?')) return;
    try {
      await deletePanoMessage(id);
      setMessages((current) => current.filter((message) => message.id !== id));
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Silme işlemi başarısız oldu.'));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBanned || !newMessage.trim() || (!isAuthenticated && !guestName.trim())) return;

    setSubmitting(true);
    setErrorMessage(null);
    try {
      const formData = new FormData(event.currentTarget);
      await submitPanoMessage({
        content: newMessage,
        guestName: isAuthenticated ? undefined : guestName,
        website: String(formData.get('website') ?? ''),
      });
      setNewMessage('');
      if (!isAuthenticated) setGuestName('');
      await fetchMessages();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Mesaj gönderilemedi.'));
    } finally {
      setSubmitting(false);
    }
  };

  const getDisplayName = (message: PanoMessage) => {
    if (message.profiles?.first_name) {
      const lastInitial = message.profiles.last_name
        ? ` ${message.profiles.last_name.trim().charAt(0)}.`
        : '';
      return `${message.profiles.first_name.trim()}${lastInitial}`;
    }
    if (message.profiles?.display_name) {
      const parts = message.profiles.display_name.trim().split(/\s+/);
      return parts.length > 1
        ? `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`
        : parts[0];
    }
    return message.guest_name?.trim() || (message.user_id ? 'Okur' : 'Anonim');
  };

  return (
    <section className="font-sans">
      {errorMessage && (
        <div className="mb-6 bg-red-950/40 border border-red-800/60 rounded-xl p-4 text-red-300 text-sm text-center">
          {errorMessage}
        </div>
      )}

      {isBanned ? (
        <div className="mb-8 bg-red-950/30 border border-red-800/50 rounded-xl p-4 text-center text-red-300 text-sm">
          Hesabınız askıya alındığı için panoya mesaj gönderemezsiniz.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mb-10 glass-card bg-[#64090C]/10 rounded-xl p-6 border border-[#64090C]/30 shadow-xl shadow-[#F8D794]/5">
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />
          {!isAuthenticated && (
            <input
              type="text"
              placeholder="İsminiz (gerekli)"
              value={guestName}
              onChange={(event) => setGuestName(event.target.value)}
              minLength={2}
              maxLength={50}
              className="mb-4 bg-[#64090C]/15 border border-[#64090C]/40 focus:border-[#9C0512] focus:outline-none rounded-lg px-4 py-2.5 w-full text-[#EFEACD] placeholder:text-[#EFEACD]/30 transition-colors font-sans text-sm"
              required
            />
          )}
          <textarea
            placeholder="Panoya bir mesaj bırakın..."
            value={newMessage}
            onChange={(event) => setNewMessage(event.target.value)}
            maxLength={2000}
            className="bg-[#64090C]/15 border border-[#64090C]/40 focus:border-[#9C0512] focus:outline-none rounded-lg px-4 py-3 w-full text-[#EFEACD] placeholder:text-[#EFEACD]/30 transition-colors font-sans text-sm min-h-[100px] resize-y"
            required
          />
          <div className="flex items-center justify-between gap-4 mt-3">
            <span className="text-xs text-[#EFEACD]/30">{newMessage.length}/2000</span>
            <button
              type="submit"
              disabled={submitting || !newMessage.trim() || (!isAuthenticated && !guestName.trim())}
              className="bg-[#9C0512] hover:bg-[#7a040e] text-[#F8D794] font-medium rounded-lg px-6 py-2.5 text-sm transition-colors disabled:opacity-50"
            >
              {submitting ? 'Gönderiliyor...' : 'Gönder'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {loading ? (
          <p className="text-[#EFEACD]/40 text-sm italic text-center py-8">Mesajlar yükleniyor...</p>
        ) : messages.length > 0 ? (
          messages.map((message) => (
            <div key={message.id} className="bg-[#64090C]/10 rounded-xl p-5 border-l-2 border-[#F8D794]/30 border-r border-t border-b border-[#64090C]/30 transition hover:bg-[#64090C]/20">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  {message.profiles?.avatar_url && (
                    <Image src={message.profiles.avatar_url} alt="" width={24} height={24} className="w-6 h-6 rounded-full object-cover border border-[#64090C]/40" />
                  )}
                  <span className="font-semibold text-[#EFEACD] inline-flex items-center gap-1">
                    {getDisplayName(message)}
                    {message.profiles?.is_admin && <VerifiedBadge />}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#64090C]/15 text-[#EFEACD]/50 border border-[#64090C]/40">
                    {message.user_id ? 'Okur' : 'Misafir'}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-[#EFEACD]/40">{timeAgo(message.created_at)}</span>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDelete(message.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Sil
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[#EFEACD]/70 text-base leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
            </div>
          ))
        ) : (
          <p className="text-[#EFEACD]/40 text-sm italic text-center py-8">Henüz pano mesajı yok. İlk mesajı siz bırakın!</p>
        )}
      </div>
    </section>
  );
}
