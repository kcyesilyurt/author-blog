'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ContactMessage } from '@/lib/types';
import {
  deleteContactMessage,
  listContactMessages,
  setContactMessageRead,
} from './actions';

type MessageFilter = 'all' | 'unread' | 'read';

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function formatMessageDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [filter, setFilter] = useState<MessageFilter>('all');
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setPageError('');
    try {
      setMessages(await listContactMessages());
    } catch (error) {
      setPageError(getErrorMessage(error, 'Mesajlar yüklenemedi'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void fetchMessages(), 0);
    return () => window.clearTimeout(timeout);
  }, [fetchMessages]);

  const unreadCount = useMemo(
    () => messages.filter((message) => !message.read_at).length,
    [messages]
  );

  const filteredMessages = useMemo(() => {
    if (filter === 'unread') return messages.filter((message) => !message.read_at);
    if (filter === 'read') return messages.filter((message) => message.read_at);
    return messages;
  }, [filter, messages]);

  const handleReadState = async (message: ContactMessage) => {
    const shouldMarkRead = !message.read_at;
    setUpdatingId(message.id);

    try {
      await setContactMessageRead(message.id, shouldMarkRead);
      await fetchMessages();
    } catch (error) {
      window.alert(getErrorMessage(error, 'Mesaj durumu güncellenemedi'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (message: ContactMessage) => {
    const confirmed = window.confirm(
      `“${message.subject}” başlıklı mesajı kalıcı olarak silmek istediğinizden emin misiniz?`
    );
    if (!confirmed) return;

    setDeletingId(message.id);
    try {
      await deleteContactMessage(message.id);
      await fetchMessages();
    } catch (error) {
      window.alert(getErrorMessage(error, 'Mesaj silinemedi'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-medium text-white">İletişim Mesajları</h2>
          <p className="text-sm text-neutral-400">
            İletişim formundan gönderilen mesajları inceleyin
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-neutral-700 bg-neutral-800 px-3 py-1 text-sm text-neutral-300">
            Toplam: {messages.length}
          </span>
          <span className="rounded-full border border-pink-400/30 bg-pink-400/10 px-3 py-1 text-sm text-pink-300">
            Okunmamış: {unreadCount}
          </span>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Mesaj filtresi">
        {(
          [
            ['all', 'Tümü'],
            ['unread', 'Okunmamış'],
            ['read', 'Okunmuş'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
              filter === value
                ? 'border-pink-400/40 bg-pink-400/10 text-pink-300'
                : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {pageError && (
        <div className="mb-6 rounded-xl border border-red-800/60 bg-red-950/30 p-4 text-sm text-red-300">
          {pageError}
          <button
            type="button"
            onClick={() => void fetchMessages()}
            className="ml-3 font-medium underline underline-offset-2"
          >
            Yeniden dene
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-sm italic text-neutral-500">Mesajlar yükleniyor...</p>
      ) : filteredMessages.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 py-12 text-center">
          <p className="text-neutral-500">
            {filter === 'all' ? 'Henüz bir iletişim mesajı yok.' : 'Bu filtrede mesaj bulunmuyor.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMessages.map((message) => {
            const isRead = Boolean(message.read_at);
            return (
              <article
                key={message.id}
                className={`rounded-xl border p-5 transition ${
                  isRead
                    ? 'border-neutral-800 bg-neutral-900/50'
                    : 'border-pink-400/30 bg-pink-950/10'
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words font-semibold text-white">{message.subject}</h3>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                          isRead
                            ? 'border-neutral-700 bg-neutral-800 text-neutral-400'
                            : 'border-pink-400/40 bg-pink-400/10 text-pink-300'
                        }`}
                      >
                        {isRead ? 'Okundu' : 'Yeni'}
                      </span>
                      <span className="rounded-full border border-neutral-700 bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
                        {message.user_id ? 'Okur' : 'Misafir'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                      <span className="font-medium text-neutral-200">{message.name}</span>
                      <span className="text-neutral-600">•</span>
                      <a
                        href={`mailto:${message.email}`}
                        className="break-all text-pink-400 transition hover:text-pink-300"
                      >
                        {message.email}
                      </a>
                      <span className="text-neutral-600">•</span>
                      <time dateTime={message.created_at} className="text-xs text-neutral-500">
                        {formatMessageDate(message.created_at)}
                      </time>
                    </div>

                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-300">
                      {message.message}
                    </p>

                    {message.read_at && (
                      <p className="text-xs text-neutral-600">
                        Okunma zamanı: {formatMessageDate(message.read_at)}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={updatingId === message.id}
                      onClick={() => void handleReadState(message)}
                      className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-200 transition hover:border-pink-400/40 hover:text-pink-300 disabled:opacity-50"
                    >
                      {updatingId === message.id
                        ? 'Güncelleniyor...'
                        : isRead
                          ? 'Okunmadı Yap'
                          : 'Okundu Yap'}
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === message.id}
                      onClick={() => void handleDelete(message)}
                      className="rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-900/60 disabled:opacity-50"
                    >
                      {deletingId === message.id ? 'Siliniyor...' : 'Sil'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
