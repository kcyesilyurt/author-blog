'use client';

import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Event as AuthorEvent } from '@/lib/types';
import { slugify } from '@/lib/utils';
import { createEvent, deleteEvent, listEvents, updateEvent } from './actions';

const EVENT_STATUSES = [
  { value: 'draft', label: 'Taslak' },
  { value: 'published', label: 'Yayında' },
  { value: 'archived', label: 'Arşivde' },
] as const;

const inputClassName =
  'w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm text-neutral-100 outline-none transition focus:border-pink-400';

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function toTimeInput(value: string | null): string {
  return value ? value.slice(0, 5) : '';
}

function formatEventDate(value: string): string {
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
}

function statusClasses(status: AuthorEvent['status']): string {
  if (status === 'published') {
    return 'border-emerald-800 bg-emerald-950/60 text-emerald-300';
  }
  if (status === 'archived') {
    return 'border-amber-800 bg-amber-950/50 text-amber-300';
  }
  return 'border-neutral-700 bg-neutral-800 text-neutral-300';
}

function statusLabel(status: AuthorEvent['status']): string {
  return EVENT_STATUSES.find((item) => item.value === status)?.label ?? status;
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<AuthorEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createSlug, setCreateSlug] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setPageError('');
    try {
      setEvents(await listEvents());
    } catch (error) {
      setPageError(getErrorMessage(error, 'Etkinlikler yüklenemedi'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void fetchEvents(), 0);
    return () => window.clearTimeout(timeout);
  }, [fetchEvents]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setCreating(true);

    try {
      await createEvent(formData);
      form.reset();
      setCreateTitle('');
      setCreateSlug('');
      setShowCreateForm(false);
      await fetchEvents();
    } catch (error) {
      window.alert(getErrorMessage(error, 'Etkinlik oluşturulamadı'));
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (
    eventId: string,
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setUpdatingId(eventId);

    try {
      await updateEvent(eventId, formData);
      setEditingId(null);
      await fetchEvents();
    } catch (error) {
      window.alert(getErrorMessage(error, 'Etkinlik güncellenemedi'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (eventItem: AuthorEvent) => {
    const confirmed = window.confirm(
      `“${eventItem.title}” etkinliğini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
    );
    if (!confirmed) return;

    setDeletingId(eventItem.id);
    try {
      await deleteEvent(eventItem.id);
      if (editingId === eventItem.id) setEditingId(null);
      await fetchEvents();
    } catch (error) {
      window.alert(getErrorMessage(error, 'Etkinlik silinemedi'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-medium text-white">Etkinlik Yönetimi</h2>
          <p className="text-sm text-neutral-400">
            Fuar, imza günü ve okur buluşmalarını yönetin
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-neutral-700 bg-neutral-800 px-3 py-1 text-sm text-neutral-300">
            Toplam: {events.length}
          </span>
          <button
            type="button"
            onClick={() => setShowCreateForm((current) => !current)}
            className="rounded-lg bg-pink-400 px-4 py-2 text-sm font-medium text-black transition hover:bg-pink-300"
          >
            {showCreateForm ? 'İptal' : '+ Yeni Etkinlik'}
          </button>
        </div>
      </div>

      {showCreateForm && (
        <form
          onSubmit={handleCreate}
          className="glass-card mb-8 space-y-4 rounded-xl border border-neutral-800 bg-neutral-900/60 p-6"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="new-event-title" className="mb-1 block text-sm font-medium text-neutral-400">
                Başlık
              </label>
              <input
                id="new-event-title"
                name="title"
                type="text"
                required
                minLength={2}
                maxLength={160}
                value={createTitle}
                onChange={(event) => {
                  const title = event.target.value;
                  setCreateTitle(title);
                  setCreateSlug(slugify(title));
                }}
                placeholder="Örn: İstanbul Kitap Fuarı"
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="new-event-slug" className="mb-1 block text-sm font-medium text-neutral-400">
                URL adresi
              </label>
              <input
                id="new-event-slug"
                name="slug"
                type="text"
                required
                maxLength={120}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                value={createSlug}
                onChange={(event) => setCreateSlug(event.target.value)}
                placeholder="istanbul-kitap-fuari"
                className={inputClassName}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <label htmlFor="new-event-location" className="mb-1 block text-sm font-medium text-neutral-400">
                Konum
              </label>
              <input
                id="new-event-location"
                name="location"
                type="text"
                required
                minLength={2}
                maxLength={200}
                placeholder="Mekân, stant veya şehir"
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="new-event-date" className="mb-1 block text-sm font-medium text-neutral-400">
                Tarih
              </label>
              <input
                id="new-event-date"
                name="event_date"
                type="date"
                required
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="new-event-time" className="mb-1 block text-sm font-medium text-neutral-400">
                Saat
              </label>
              <input
                id="new-event-time"
                name="event_time"
                type="time"
                className={inputClassName}
              />
            </div>
          </div>

          <div>
            <label htmlFor="new-event-description" className="mb-1 block text-sm font-medium text-neutral-400">
              Açıklama
            </label>
            <textarea
              id="new-event-description"
              name="description"
              rows={3}
              maxLength={3000}
              placeholder="Etkinliğin kısa açıklaması"
              className={inputClassName}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="new-event-url" className="mb-1 block text-sm font-medium text-neutral-400">
                Dış bağlantı
              </label>
              <input
                id="new-event-url"
                name="external_url"
                type="url"
                inputMode="url"
                maxLength={2048}
                pattern="https://.*"
                placeholder="https://..."
                className={inputClassName}
              />
              <p className="mt-1 text-xs text-neutral-500">Yalnız HTTPS adresleri kabul edilir.</p>
            </div>
            <div>
              <label htmlFor="new-event-status" className="mb-1 block text-sm font-medium text-neutral-400">
                Durum
              </label>
              <select
                id="new-event-status"
                name="status"
                defaultValue="draft"
                className={inputClassName}
              >
                {EVENT_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-pink-400 px-6 py-2.5 text-sm font-medium text-black transition hover:bg-pink-300 disabled:opacity-50"
          >
            {creating ? 'Oluşturuluyor...' : 'Etkinliği Oluştur'}
          </button>
        </form>
      )}

      {pageError && (
        <div className="mb-6 rounded-xl border border-red-800/60 bg-red-950/30 p-4 text-sm text-red-300">
          {pageError}
          <button
            type="button"
            onClick={() => void fetchEvents()}
            className="ml-3 font-medium underline underline-offset-2"
          >
            Yeniden dene
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-sm italic text-neutral-500">Etkinlikler yükleniyor...</p>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 py-12 text-center">
          <p className="text-neutral-500">Henüz bir etkinlik eklenmemiş.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((eventItem) => {
            const isEditing = editingId === eventItem.id;
            return (
              <article
                key={eventItem.id}
                className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">{eventItem.title}</h3>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusClasses(eventItem.status)}`}
                      >
                        {statusLabel(eventItem.status)}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-300">
                      {formatEventDate(eventItem.event_date)}
                      {eventItem.event_time ? ` · ${toTimeInput(eventItem.event_time)}` : ''}
                      {' · '}
                      {eventItem.location}
                    </p>
                    <p className="text-xs text-neutral-500">/{eventItem.slug}</p>
                    {eventItem.description && (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-400">
                        {eventItem.description}
                      </p>
                    )}
                    {eventItem.external_url && (
                      <a
                        href={eventItem.external_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block text-sm text-pink-400 transition hover:text-pink-300"
                      >
                        Etkinlik bağlantısını aç ↗
                      </a>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(isEditing ? null : eventItem.id)}
                      className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-200 transition hover:border-pink-400/40 hover:text-pink-300"
                    >
                      {isEditing ? 'İptal' : 'Düzenle'}
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === eventItem.id}
                      onClick={() => void handleDelete(eventItem)}
                      className="rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-900/60 disabled:opacity-50"
                    >
                      {deletingId === eventItem.id ? 'Siliniyor...' : 'Sil'}
                    </button>
                  </div>
                </div>

                {isEditing && (
                  <form
                    onSubmit={(event) => void handleUpdate(eventItem.id, event)}
                    className="mt-5 space-y-4 border-t border-neutral-800 pt-5"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor={`event-title-${eventItem.id}`} className="mb-1 block text-sm text-neutral-400">
                          Başlık
                        </label>
                        <input
                          id={`event-title-${eventItem.id}`}
                          name="title"
                          type="text"
                          required
                          minLength={2}
                          maxLength={160}
                          defaultValue={eventItem.title}
                          className={inputClassName}
                        />
                      </div>
                      <div>
                        <label htmlFor={`event-slug-${eventItem.id}`} className="mb-1 block text-sm text-neutral-400">
                          URL adresi
                        </label>
                        <input
                          id={`event-slug-${eventItem.id}`}
                          name="slug"
                          type="text"
                          required
                          maxLength={120}
                          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                          defaultValue={eventItem.slug}
                          className={inputClassName}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="lg:col-span-2">
                        <label htmlFor={`event-location-${eventItem.id}`} className="mb-1 block text-sm text-neutral-400">
                          Konum
                        </label>
                        <input
                          id={`event-location-${eventItem.id}`}
                          name="location"
                          type="text"
                          required
                          minLength={2}
                          maxLength={200}
                          defaultValue={eventItem.location}
                          className={inputClassName}
                        />
                      </div>
                      <div>
                        <label htmlFor={`event-date-${eventItem.id}`} className="mb-1 block text-sm text-neutral-400">
                          Tarih
                        </label>
                        <input
                          id={`event-date-${eventItem.id}`}
                          name="event_date"
                          type="date"
                          required
                          defaultValue={eventItem.event_date}
                          className={inputClassName}
                        />
                      </div>
                      <div>
                        <label htmlFor={`event-time-${eventItem.id}`} className="mb-1 block text-sm text-neutral-400">
                          Saat
                        </label>
                        <input
                          id={`event-time-${eventItem.id}`}
                          name="event_time"
                          type="time"
                          defaultValue={toTimeInput(eventItem.event_time)}
                          className={inputClassName}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor={`event-description-${eventItem.id}`} className="mb-1 block text-sm text-neutral-400">
                        Açıklama
                      </label>
                      <textarea
                        id={`event-description-${eventItem.id}`}
                        name="description"
                        rows={3}
                        maxLength={3000}
                        defaultValue={eventItem.description ?? ''}
                        className={inputClassName}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor={`event-url-${eventItem.id}`} className="mb-1 block text-sm text-neutral-400">
                          Dış bağlantı
                        </label>
                        <input
                          id={`event-url-${eventItem.id}`}
                          name="external_url"
                          type="url"
                          inputMode="url"
                          maxLength={2048}
                          pattern="https://.*"
                          defaultValue={eventItem.external_url ?? ''}
                          className={inputClassName}
                        />
                      </div>
                      <div>
                        <label htmlFor={`event-status-${eventItem.id}`} className="mb-1 block text-sm text-neutral-400">
                          Durum
                        </label>
                        <select
                          id={`event-status-${eventItem.id}`}
                          name="status"
                          defaultValue={eventItem.status}
                          className={inputClassName}
                        >
                          {EVENT_STATUSES.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={updatingId === eventItem.id}
                        className="rounded-lg bg-pink-400 px-5 py-2 text-sm font-medium text-black transition hover:bg-pink-300 disabled:opacity-50"
                      >
                        {updatingId === eventItem.id ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                      </button>
                    </div>
                  </form>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
