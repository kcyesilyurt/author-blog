'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Event } from '@/lib/types';
import {
  optionalHttpsUrl,
  optionalText,
  requireSlug,
  requireText,
  requireUuid,
} from '@/lib/validation';

const EVENT_STATUSES = ['draft', 'published', 'archived'] as const;
type EventStatus = (typeof EVENT_STATUSES)[number];

type EventInput = {
  slug: string;
  title: string;
  location: string;
  event_date: string;
  event_time: string | null;
  description: string | null;
  external_url: string | null;
  status: EventStatus;
};

function requireEventStatus(value: unknown): EventStatus {
  if (
    typeof value !== 'string' ||
    !EVENT_STATUSES.includes(value as EventStatus)
  ) {
    throw new Error('Etkinlik durumu geçersiz');
  }

  return value as EventStatus;
}

function requireEventDate(value: unknown): string {
  const eventDate = requireText(value, {
    fieldName: 'Etkinlik tarihi',
    min: 10,
    max: 10,
  });

  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    throw new Error('Etkinlik tarihi YYYY-MM-DD biçiminde olmalıdır');
  }

  if (eventDate.startsWith('0000-')) {
    throw new Error('Geçerli bir etkinlik tarihi seçin');
  }

  const parsed = new Date(`${eventDate}T00:00:00.000Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== eventDate
  ) {
    throw new Error('Geçerli bir etkinlik tarihi seçin');
  }

  return eventDate;
}

function optionalEventTime(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') throw new Error('Etkinlik saati geçersiz');

  const eventTime = value.trim();
  if (!eventTime) return null;
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(eventTime)) {
    throw new Error('Etkinlik saati HH:MM biçiminde olmalıdır');
  }

  return eventTime;
}

function parseEventInput(formData: FormData): EventInput {
  return {
    title: requireText(formData.get('title'), {
      fieldName: 'Başlık',
      min: 2,
      max: 160,
    }),
    slug: requireSlug(formData.get('slug')),
    location: requireText(formData.get('location'), {
      fieldName: 'Konum',
      min: 2,
      max: 200,
    }),
    event_date: requireEventDate(formData.get('event_date')),
    event_time: optionalEventTime(formData.get('event_time')),
    description: optionalText(formData.get('description'), 3000),
    external_url: optionalHttpsUrl(formData.get('external_url'), 'Etkinlik bağlantısı'),
    status: requireEventStatus(formData.get('status')),
  };
}

function revalidateEventPaths() {
  revalidatePath('/admin/events');
  revalidatePath('/etkinlikler');
  revalidatePath('/');
}

function eventMutationError(error: { code?: string; message: string }): Error {
  if (error.code === '23505') {
    return new Error('Bu etkinlik URL adresi zaten kullanılıyor');
  }

  console.error('Event mutation failed:', error.code ?? 'unknown');
  return new Error('Etkinlik işlemi tamamlanamadı');
}

export async function listEvents(): Promise<Event[]> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('events')
    .select(
      'id, slug, title, location, event_date, event_time, description, external_url, status, created_at, updated_at'
    )
    .order('event_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error('Etkinlikler yüklenemedi');
  return (data ?? []) as Event[];
}

export async function createEvent(formData: FormData): Promise<void> {
  await requireAdmin();
  const input = parseEventInput(formData);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('events')
    .insert(input)
    .select('id')
    .maybeSingle();

  if (error) throw eventMutationError(error);
  if (!data) throw new Error('Etkinlik oluşturulamadı');
  revalidateEventPaths();
}

export async function updateEvent(
  eventIdValue: string,
  formData: FormData
): Promise<void> {
  await requireAdmin();
  const eventId = requireUuid(eventIdValue, 'Etkinlik');
  const input = parseEventInput(formData);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('events')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', eventId)
    .select('id')
    .maybeSingle();

  if (error) throw eventMutationError(error);
  if (!data) throw new Error('Etkinlik bulunamadı');
  revalidateEventPaths();
}

export async function deleteEvent(eventIdValue: string): Promise<void> {
  await requireAdmin();
  const eventId = requireUuid(eventIdValue, 'Etkinlik');
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('events')
    .delete()
    .eq('id', eventId)
    .select('id')
    .maybeSingle();

  if (error) throw eventMutationError(error);
  if (!data) throw new Error('Etkinlik bulunamadı');
  revalidateEventPaths();
}
