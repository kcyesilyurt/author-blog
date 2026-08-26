'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import type {
  ActionResult,
  AdminFanArtItem,
  AdminPublishedFanArtItem,
  FanArtCursor,
} from '@/lib/types';
import {
  approveFanArt,
  listPendingFanArt,
  listPublishedFanArt,
  rejectFanArt,
  takeDownFanArt,
} from './actions';

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function unwrapAction<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

export default function AdminFanArtPage() {
  const [pendingItems, setPendingItems] = useState<AdminFanArtItem[]>([]);
  const [publishedItems, setPublishedItems] = useState<
    AdminPublishedFanArtItem[]
  >([]);
  const [publishedCursor, setPublishedCursor] = useState<FanArtCursor | null>(
    null
  );
  const [loadingPublished, setLoadingPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pendingResult, publishedResult] = await Promise.all([
        listPendingFanArt(),
        listPublishedFanArt(),
      ]);
      setPendingItems(unwrapAction(pendingResult));
      const publishedPage = unwrapAction(publishedResult);
      setPublishedItems(publishedPage.items);
      setPublishedCursor(publishedPage.nextCursor);
    } catch (loadError) {
      setError(errorMessage(loadError, 'Fan art inceleme sırası yüklenemedi.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadItems(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadItems]);

  const handleApprove = async (item: AdminFanArtItem) => {
    if (!window.confirm(`“${item.title}” çalışmasını yayımlamak istiyor musunuz?`)) return;
    setBusyId(item.id);
    setError(null);
    try {
      unwrapAction(await approveFanArt(item.id));
      await loadItems();
    } catch (actionError) {
      setError(errorMessage(actionError, 'Fan art onaylanamadı.'));
    } finally {
      setBusyId(null);
    }
  };

  const handleLoadMorePublished = async () => {
    if (!publishedCursor || loadingPublished) return;
    setLoadingPublished(true);
    setError(null);
    try {
      const page = unwrapAction(await listPublishedFanArt(publishedCursor));
      setPublishedItems((current) => {
        const ids = new Set(current.map((item) => item.id));
        return [
          ...current,
          ...page.items.filter((item) => !ids.has(item.id)),
        ];
      });
      setPublishedCursor(page.nextCursor);
    } catch (loadError) {
      setError(errorMessage(loadError, 'Daha fazla fan art yüklenemedi.'));
    } finally {
      setLoadingPublished(false);
    }
  };

  const handleReject = async (item: AdminFanArtItem) => {
    const reason = window.prompt(
      `“${item.title}” için kullanıcıya gösterilecek ret nedenini yazın:`,
      'Topluluk ve yayın kurallarına uygun değil.'
    );
    if (!reason?.trim()) return;

    setBusyId(item.id);
    setError(null);
    try {
      unwrapAction(await rejectFanArt(item.id, reason));
      setPendingItems((current) =>
        current.filter((candidate) => candidate.id !== item.id)
      );
    } catch (actionError) {
      setError(errorMessage(actionError, 'Fan art reddedilemedi.'));
    } finally {
      setBusyId(null);
    }
  };

  const handleTakeDown = async (item: AdminPublishedFanArtItem) => {
    const reason = window.prompt(
      `“${item.title}” için kullanıcıya gösterilecek yayından kaldırma nedenini yazın:`,
      'Yayın ve topluluk kuralları gereği yayından kaldırıldı.'
    );
    if (!reason?.trim()) return;
    if (!window.confirm(`“${item.title}” çalışmasını yayından kaldırmak istiyor musunuz?`)) {
      return;
    }

    setBusyId(item.id);
    setError(null);
    try {
      unwrapAction(await takeDownFanArt(item.id, reason));
      setPublishedItems((current) =>
        current.filter((candidate) => candidate.id !== item.id)
      );
    } catch (actionError) {
      setError(errorMessage(actionError, 'Fan art yayından kaldırılamadı.'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-medium text-white">Fan Art Moderasyonu</h2>
          <p className="text-sm text-neutral-400">Yalnızca onaylanan, temizlenmiş görseller public galeriye taşınır.</p>
        </div>
        <span className="w-fit rounded-full border border-neutral-700 bg-neutral-800 px-3 py-1 text-sm text-neutral-300">
          Bekleyen: {pendingItems.length} · Yayında: {publishedItems.length}
          {publishedCursor ? '+' : ''}
        </span>
      </div>

      {error && (
        <p role="alert" className="mb-5 rounded-lg border border-red-800/60 bg-red-950/30 p-4 text-sm text-red-300">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm italic text-neutral-500">Fan art sırası yükleniyor...</p>
      ) : pendingItems.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 py-12 text-center">
          <p className="text-neutral-500">İnceleme bekleyen fan art yok.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {pendingItems.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/60">
              <div className="bg-black/30">
                <Image
                  src={item.previewUrl}
                  alt={item.altText}
                  width={item.width}
                  height={item.height}
                  unoptimized
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="h-auto max-h-[460px] w-full object-contain"
                />
              </div>
              <div className="space-y-3 p-5">
                <div>
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="mt-1 text-sm text-pink-300">{item.artistName}</p>
                </div>
                <p className="text-xs text-neutral-500">Alt metin: {item.altText}</p>
                {item.caption && (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-300">{item.caption}</p>
                )}
                <div className="flex gap-3 border-t border-neutral-800 pt-4">
                  <button
                    type="button"
                    onClick={() => void handleApprove(item)}
                    disabled={busyId !== null}
                    className="min-h-11 flex-1 rounded-lg border border-emerald-800/60 bg-emerald-950/40 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-900/50 disabled:opacity-50"
                  >
                    {busyId === item.id ? 'İşleniyor...' : 'Onayla'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleReject(item)}
                    disabled={busyId !== null}
                    className="min-h-11 flex-1 rounded-lg border border-red-800/60 bg-red-950/40 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-900/50 disabled:opacity-50"
                  >
                    Reddet
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && (
        <section className="mt-12 border-t border-neutral-800 pt-8" aria-labelledby="published-fan-art-title">
          <div className="mb-5">
            <h3 id="published-fan-art-title" className="text-lg font-medium text-white">
              Yayındaki Çalışmalar
            </h3>
            <p className="mt-1 text-sm text-neutral-400">
              Son 50 çalışma. Yanlış onay veya telif şikâyetinde içerik buradan yayından alınır.
            </p>
          </div>

          {publishedItems.length === 0 ? (
            <p className="rounded-xl border border-neutral-800 bg-neutral-900/40 py-10 text-center text-neutral-500">
              Yayında fan art yok.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {publishedItems.map((item) => (
                <article key={item.id} className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/60">
                  <Image
                    src={item.imageUrl}
                    alt={item.altText}
                    width={item.width}
                    height={item.height}
                    unoptimized
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                    className="h-52 w-full bg-black/30 object-contain"
                  />
                  <div className="space-y-3 p-4">
                    <div>
                      <h4 className="font-semibold text-white">{item.title}</h4>
                      <p className="mt-1 text-sm text-pink-300">{item.artistName}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleTakeDown(item)}
                      disabled={busyId !== null}
                      className="min-h-11 w-full rounded-lg border border-red-800/60 bg-red-950/40 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-900/50 disabled:opacity-50"
                    >
                      {busyId === item.id ? 'Kaldırılıyor...' : 'Yayından Kaldır'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          {publishedCursor && (
            <button
              type="button"
              onClick={() => void handleLoadMorePublished()}
              disabled={loadingPublished}
              className="mt-6 min-h-11 w-full rounded-lg border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 transition hover:bg-neutral-800 disabled:opacity-50"
            >
              {loadingPublished ? 'Yükleniyor...' : 'Daha Fazla Göster'}
            </button>
          )}
        </section>
      )}
    </div>
  );
}
