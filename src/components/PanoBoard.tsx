'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { timeAgo } from '@/lib/utils';
import { appendUniqueById, prependUniqueById } from '@/lib/community-pagination';
import type { CommunityCursor, PanoMessage } from '@/lib/types';
import VerifiedBadge from '@/components/VerifiedBadge';
import CommunityRoleTag from '@/components/CommunityRoleTag';
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<CommunityCursor | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [guestName, setGuestName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const loadMorePendingRef = useRef(false);

  const fetchMessages = useCallback(async () => {
    try {
      const page = await listPanoMessages();
      setMessages(page.items);
      setNextCursor(page.nextCursor);
    } catch {
      setErrorMessage('Pano mesajları yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLoadMore = async () => {
    if (!nextCursor || loadMorePendingRef.current) return;

    loadMorePendingRef.current = true;
    setLoadingMore(true);
    setErrorMessage(null);
    try {
      const page = await listPanoMessages(nextCursor);
      setMessages((current) => appendUniqueById(current, page.items));
      setNextCursor(page.nextCursor);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Daha fazla mesaj yüklenemedi.'));
    } finally {
      loadMorePendingRef.current = false;
      setLoadingMore(false);
    }
  };

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
      const createdMessage = await submitPanoMessage({
        content: newMessage,
        guestName: isAuthenticated ? undefined : guestName,
        website: String(formData.get('website') ?? ''),
      });
      setNewMessage('');
      if (!isAuthenticated) setGuestName('');
      setMessages((current) => prependUniqueById(current, createdMessage));
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
            <div className="mb-4">
              <label htmlFor="pano-guest-name" className="mb-2 block text-base font-medium text-[#EFEACD]/70">
                İsminiz
              </label>
              <input
                id="pano-guest-name"
                type="text"
                placeholder="İsminiz (gerekli)"
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                minLength={2}
                maxLength={50}
                className="min-h-12 w-full rounded-lg border border-[#64090C]/40 bg-[#64090C]/15 px-4 py-3 font-sans text-base text-[#EFEACD] placeholder:text-[#EFEACD]/30 transition-colors focus:border-[#9C0512] focus:outline-none"
                required
              />
            </div>
          )}
          <label htmlFor="pano-message" className="mb-2 block text-base font-medium text-[#EFEACD]/70">
            Mesajınız
          </label>
          <textarea
            id="pano-message"
            placeholder="Panoya bir mesaj bırakın..."
            value={newMessage}
            onChange={(event) => setNewMessage(event.target.value)}
            maxLength={2000}
            className="min-h-[120px] w-full resize-y rounded-lg border border-[#64090C]/40 bg-[#64090C]/15 px-4 py-3 font-sans text-base text-[#EFEACD] placeholder:text-[#EFEACD]/30 transition-colors focus:border-[#9C0512] focus:outline-none"
            required
          />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-[#EFEACD]/30">{newMessage.length}/2000</span>
            <button
              type="submit"
              disabled={submitting || !newMessage.trim() || (!isAuthenticated && !guestName.trim())}
              className="min-h-12 w-full rounded-lg bg-[#9C0512] px-6 py-3 text-base font-medium text-[#F8D794] transition-colors hover:bg-[#7a040e] disabled:opacity-50 sm:w-auto"
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
                  <CommunityRoleTag
                    isAdmin={message.profiles?.is_admin === true}
                    isRegistered={Boolean(message.user_id)}
                  />
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-[#EFEACD]/40">{timeAgo(message.created_at)}</span>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDelete(message.id)}
                      className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-lg px-3 text-sm text-red-400 hover:bg-red-950/30 hover:text-red-300"
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

      {nextCursor && !loading && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => void handleLoadMore()}
            disabled={loadingMore}
            className="min-h-12 w-full rounded-lg border border-[#F8D794]/25 px-6 py-3 text-base font-medium text-[#F8D794] transition hover:bg-[#F8D794]/10 disabled:opacity-50 sm:w-auto"
          >
            {loadingMore ? 'Yükleniyor...' : 'Daha Fazla Yükle'}
          </button>
        </div>
      )}
    </section>
  );
}
