'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  cancelFanArtUpload,
  createFanArtUploadTicket,
  finalizeFanArtUpload,
  getFanArtViewerState,
  listMyFanArtSubmissions,
  listPublicFanArt,
} from '@/app/fan-art/actions';
import { createClient } from '@/lib/supabase/client';
import type {
  ActionResult,
  FanArtCursor,
  FanArtOwnCursor,
  FanArtOwnItem,
  FanArtPublicItem,
} from '@/lib/types';
import { FAN_ART_IMAGE_MAX_BYTES, formatUploadLimit } from '@/lib/upload-limits';

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function unwrapAction<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

function statusLabel(status: FanArtOwnItem['status']): string {
  if (status === 'pending') return 'İncelemede';
  if (status === 'approved') return 'Yayında';
  if (status === 'removed') return 'Yayından kaldırıldı';
  return 'Reddedildi';
}

export default function FanArtGallery() {
  const supabase = useMemo(() => createClient(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);
  const [items, setItems] = useState<FanArtPublicItem[]>([]);
  const [nextCursor, setNextCursor] = useState<FanArtCursor | null>(null);
  const [ownItems, setOwnItems] = useState<FanArtOwnItem[]>([]);
  const [ownNextCursor, setOwnNextCursor] = useState<FanArtOwnCursor | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingMoreOwn, setLoadingMoreOwn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [altText, setAltText] = useState('');
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [galleryResult, viewerResult] = await Promise.all([
        listPublicFanArt(),
        getFanArtViewerState(),
      ]);
      const gallery = unwrapAction(galleryResult);
      const viewer = unwrapAction(viewerResult);
      setItems(gallery.items);
      setNextCursor(gallery.nextCursor);
      setIsAuthenticated(viewer.isAuthenticated);
      setIsBanned(viewer.isBanned);
      if (viewer.isAuthenticated) {
        const ownPage = unwrapAction(await listMyFanArtSubmissions());
        setOwnItems(ownPage.items);
        setOwnNextCursor(ownPage.nextCursor);
      }
    } catch (loadError) {
      setError(errorMessage(loadError, 'Fan art sayfası yüklenemedi.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadInitialData(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadInitialData]);

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const page = unwrapAction(await listPublicFanArt(nextCursor));
      setItems((current) => {
        const ids = new Set(current.map((item) => item.id));
        return [...current, ...page.items.filter((item) => !ids.has(item.id))];
      });
      setNextCursor(page.nextCursor);
    } catch (loadError) {
      setError(errorMessage(loadError, 'Daha fazla fan art yüklenemedi.'));
    } finally {
      setLoadingMore(false);
    }
  };

  const handleLoadMoreOwn = async () => {
    if (!ownNextCursor || loadingMoreOwn) return;
    setLoadingMoreOwn(true);
    setError(null);
    try {
      const page = unwrapAction(await listMyFanArtSubmissions(ownNextCursor));
      setOwnItems((current) => {
        const ids = new Set(current.map((item) => item.id));
        return [...current, ...page.items.filter((item) => !ids.has(item.id))];
      });
      setOwnNextCursor(page.nextCursor);
    } catch (loadError) {
      setError(errorMessage(loadError, 'Daha fazla gönderiniz yüklenemedi.'));
    } finally {
      setLoadingMoreOwn(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError('Lütfen bir görsel seçin.');
      return;
    }
    if (file.size > FAN_ART_IMAGE_MAX_BYTES) {
      setError(`Görsel en fazla ${formatUploadLimit(FAN_ART_IMAGE_MAX_BYTES)} olabilir.`);
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    let submissionId: number | null = null;
    try {
      const ticket = unwrapAction(
        await createFanArtUploadTicket({
          title,
          caption,
          altText,
          rightsConfirmed,
          mime: file.type,
          size: file.size,
        })
      );
      submissionId = ticket.submissionId;
      const { error: uploadError } = await supabase.storage
        .from('fan-art-staging')
        .uploadToSignedUrl(ticket.path, ticket.token, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false,
        });
      if (uploadError) throw new Error('Görsel Supabase Storage alanına yüklenemedi');

      const ownItem = unwrapAction(
        await finalizeFanArtUpload(ticket.submissionId)
      );
      setOwnItems((current) => [
        ownItem,
        ...current.filter((item) => item.id !== ownItem.id),
      ]);
      setTitle('');
      setCaption('');
      setAltText('');
      setRightsConfirmed(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSuccess('Çalışmanız güvenli biçime dönüştürüldü ve inceleme sırasına alındı.');
      submissionId = null;
    } catch (submitError) {
      if (submissionId !== null) {
        try {
          unwrapAction(await cancelFanArtUpload(submissionId));
        } catch {
          // Three-hour stale-upload cleanup is the fallback for a failed cancel.
        }
      }
      setError(errorMessage(submitError, 'Fan art gönderilemedi.'));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-14">
      {error && (loading || !isAuthenticated || isBanned) && (
        <p
          role="alert"
          aria-live="polite"
          className="rounded-lg border border-red-800/50 bg-red-950/30 p-3 text-sm text-red-300"
        >
          {error}
        </p>
      )}
      <section aria-labelledby="fan-art-upload-title" className="rounded-2xl border border-[#64090C]/30 bg-[#64090C]/10 p-5 sm:p-7">
        <div className="mb-6">
          <h2 id="fan-art-upload-title" className="font-serif text-2xl font-bold text-[#EFEACD]">
            Çalışmanı Gönder
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#EFEACD]/55">
            Yalnızca paylaşma hakkına sahip olduğunuz JPEG, PNG veya WebP çalışmalar kabul edilir. Her görsel yayımlanmadan önce incelenir.
          </p>
        </div>

        {loading ? (
          <p className="rounded-xl border border-[#F8D794]/15 bg-[#0E0000]/30 p-5 text-sm italic text-[#EFEACD]/45">
            Gönderim yetkisi kontrol ediliyor...
          </p>
        ) : !isAuthenticated ? (
          <div className="rounded-xl border border-[#F8D794]/15 bg-[#0E0000]/30 p-5 text-sm text-[#EFEACD]/65">
            Fan art göndermek için{' '}
            <Link href="/auth/login?next=/fan-art" className="font-medium text-[#F8D794] hover:underline">
              giriş yapın
            </Link>{' '}
            veya{' '}
            <Link href="/auth/signup" className="font-medium text-[#F8D794] hover:underline">
              hesap oluşturun
            </Link>.
          </div>
        ) : isBanned ? (
          <p className="rounded-xl border border-red-800/50 bg-red-950/30 p-4 text-sm text-red-300">
            Askıya alınan hesaplar fan art gönderemez.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="fan-art-title" className="mb-2 block text-sm font-medium text-[#EFEACD]/75">
                  Çalışmanın başlığı
                </label>
                <input
                  id="fan-art-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  minLength={2}
                  maxLength={100}
                  required
                  className="min-h-12 w-full rounded-lg border border-[#64090C]/40 bg-[#0E0000]/35 px-4 py-3 text-base text-[#EFEACD] focus:border-[#F8D794] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="fan-art-file" className="mb-2 block text-sm font-medium text-[#EFEACD]/75">
                  Görsel
                </label>
                <input
                  ref={fileInputRef}
                  id="fan-art-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  required
                  className="min-h-12 w-full cursor-pointer rounded-lg border border-[#64090C]/40 bg-[#0E0000]/35 px-3 py-2 text-base text-[#EFEACD]/70 file:mr-3 file:rounded-md file:border-0 file:bg-[#64090C]/40 file:px-3 file:py-2 file:text-sm file:text-[#F8D794]"
                />
                <p className="mt-1.5 text-xs text-[#EFEACD]/35">
                  En fazla {formatUploadLimit(FAN_ART_IMAGE_MAX_BYTES)}
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="fan-art-alt" className="mb-2 block text-sm font-medium text-[#EFEACD]/75">
                Görsel açıklaması
              </label>
              <input
                id="fan-art-alt"
                value={altText}
                onChange={(event) => setAltText(event.target.value)}
                minLength={5}
                maxLength={180}
                required
                placeholder="Örn. Kayıp Liman karakterinin deniz kenarında dijital çizimi"
                className="min-h-12 w-full rounded-lg border border-[#64090C]/40 bg-[#0E0000]/35 px-4 py-3 text-base text-[#EFEACD] placeholder:text-[#EFEACD]/25 focus:border-[#F8D794] focus:outline-none"
              />
              <p className="mt-1.5 text-xs text-[#EFEACD]/35">Ekran okuyucu kullanan ziyaretçiler için görselde ne olduğunu anlatın.</p>
            </div>

            <div>
              <label htmlFor="fan-art-caption" className="mb-2 block text-sm font-medium text-[#EFEACD]/75">
                Notunuz <span className="font-normal text-[#EFEACD]/35">(isteğe bağlı)</span>
              </label>
              <textarea
                id="fan-art-caption"
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                maxLength={500}
                rows={3}
                className="w-full resize-y rounded-lg border border-[#64090C]/40 bg-[#0E0000]/35 px-4 py-3 text-base text-[#EFEACD] focus:border-[#F8D794] focus:outline-none"
              />
            </div>

            <label className="flex items-start gap-3 text-sm leading-relaxed text-[#EFEACD]/65">
              <input
                type="checkbox"
                checked={rightsConfirmed}
                onChange={(event) => setRightsConfirmed(event.target.checked)}
                required
                className="mt-1 h-5 w-5 shrink-0 accent-[#9C0512]"
              />
              Bu çalışmayı ben oluşturdum veya burada paylaşma iznim var; yayımlanmadan önce moderasyondan geçeceğini kabul ediyorum.
            </label>

            {(error || success) && (
              <p
                role={error ? 'alert' : 'status'}
                aria-live="polite"
                className={`rounded-lg border p-3 text-sm ${
                  error
                    ? 'border-red-800/50 bg-red-950/30 text-red-300'
                    : 'border-emerald-800/50 bg-emerald-950/20 text-emerald-300'
                }`}
              >
                {error || success}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !rightsConfirmed}
              className="min-h-12 w-full rounded-lg bg-[#9C0512] px-6 py-3 font-medium text-[#F8D794] transition hover:bg-[#7a040e] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {submitting ? 'Güvenli biçime dönüştürülüyor...' : 'İncelemeye Gönder'}
            </button>
          </form>
        )}

        {ownItems.length > 0 && (
          <div className="mt-8 border-t border-[#64090C]/30 pt-6">
            <h3 className="font-semibold text-[#EFEACD]">Gönderilerim</h3>
            <div className="mt-3 space-y-2">
              {ownItems.map((item) => (
                <div key={item.id} className="flex flex-col gap-1 rounded-lg bg-[#0E0000]/25 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-[#EFEACD]/75">{item.title}</span>
                  <span className={item.status === 'approved' ? 'text-emerald-300' : item.status === 'rejected' || item.status === 'removed' ? 'text-red-300' : 'text-[#F8D794]'}>
                    {statusLabel(item.status)}
                    {item.moderationReason ? ` — ${item.moderationReason}` : ''}
                  </span>
                </div>
              ))}
            </div>
            {ownNextCursor && (
              <button
                type="button"
                onClick={() => void handleLoadMoreOwn()}
                disabled={loadingMoreOwn}
                className="mt-4 min-h-11 rounded-lg border border-[#F8D794]/20 px-4 py-2 text-sm font-medium text-[#F8D794] transition hover:bg-[#F8D794]/10 disabled:opacity-50"
              >
                {loadingMoreOwn ? 'Yükleniyor...' : 'Eski Gönderilerimi Göster'}
              </button>
            )}
          </div>
        )}
      </section>

      <section aria-labelledby="fan-art-gallery-title">
        <div className="mb-7 text-center">
          <h2 id="fan-art-gallery-title" className="font-serif text-3xl font-bold text-[#EFEACD]">
            Galeri
          </h2>
          <div className="ornament-divider">✦</div>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm italic text-[#EFEACD]/40">Galeri yükleniyor...</p>
        ) : items.length === 0 ? (
          <p className="rounded-xl border border-[#64090C]/25 bg-[#64090C]/10 py-12 text-center text-[#EFEACD]/45">
            Henüz yayımlanmış fan art yok. İlk çalışmayı siz gönderin!
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-xl border border-[#64090C]/30 bg-[#64090C]/10">
                <div className="bg-[#0E0000]/40">
                  <Image
                    src={item.imageUrl}
                    alt={item.altText}
                    width={item.width}
                    height={item.height}
                    unoptimized
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="h-auto max-h-[520px] w-full object-contain"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-serif text-lg font-semibold text-[#EFEACD]">{item.title}</h3>
                  <p className="mt-1 text-sm text-[#F8D794]/70">{item.artistName}</p>
                  {item.caption && (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#EFEACD]/55">{item.caption}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {nextCursor && !loading && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => void handleLoadMore()}
              disabled={loadingMore}
              className="min-h-12 w-full rounded-lg border border-[#F8D794]/25 px-6 py-3 font-medium text-[#F8D794] transition hover:bg-[#F8D794]/10 disabled:opacity-50 sm:w-auto"
            >
              {loadingMore ? 'Yükleniyor...' : 'Daha Fazla Göster'}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
