export const PUBLICATION_STATUSES = ['draft', 'scheduled', 'published', 'archived'] as const;
export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function requireUuid(value: unknown, fieldName = 'Kimlik'): string {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    throw new Error(`${fieldName} geçersiz`);
  }
  return value;
}

export function requireText(
  value: unknown,
  options: { fieldName: string; min: number; max: number }
): string {
  if (typeof value !== 'string') {
    throw new Error(`${options.fieldName} geçersiz`);
  }

  const normalized = value.trim();
  if (normalized.length < options.min || normalized.length > options.max) {
    throw new Error(
      `${options.fieldName} ${options.min}-${options.max} karakter arasında olmalıdır`
    );
  }

  return normalized;
}

export function requireSlug(value: unknown): string {
  const slug = requireText(value, { fieldName: 'URL adresi', min: 1, max: 120 });
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error('URL adresi yalnızca küçük harf, rakam ve tire içerebilir');
  }
  return slug;
}

export function requireEmail(value: unknown): string {
  const email = requireText(value, { fieldName: 'E-posta adresi', min: 3, max: 254 })
    .toLocaleLowerCase('tr-TR');

  if (!EMAIL_PATTERN.test(email)) {
    throw new Error('Geçerli bir e-posta adresi girin');
  }

  return email;
}

export function optionalHttpsUrl(value: unknown, fieldName = 'Bağlantı'): string | null {
  const rawUrl = optionalText(value, 2048);
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'https:') throw new Error();
    return url.toString();
  } catch {
    throw new Error(`${fieldName} geçerli bir HTTPS adresi olmalıdır`);
  }
}

export function optionalText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > max) throw new Error(`Metin en fazla ${max} karakter olabilir`);
  return normalized;
}

export function parsePublicationInput(
  statusValue: unknown,
  publishedAtValue: unknown,
  now = new Date()
): { status: PublicationStatus; publishedAt: string | null } {
  if (
    typeof statusValue !== 'string' ||
    !PUBLICATION_STATUSES.includes(statusValue as PublicationStatus)
  ) {
    throw new Error('Yayın durumu geçersiz');
  }

  const status = statusValue as PublicationStatus;
  const rawDate = typeof publishedAtValue === 'string' ? publishedAtValue.trim() : '';

  if (status === 'draft') {
    return { status, publishedAt: null };
  }

  if (status === 'published' && !rawDate) {
    return { status, publishedAt: now.toISOString() };
  }

  if (status === 'archived' && !rawDate) {
    return { status, publishedAt: null };
  }

  const date = new Date(rawDate);
  if (!rawDate || Number.isNaN(date.getTime())) {
    throw new Error('Geçerli bir yayın tarihi seçin');
  }

  if (status === 'scheduled' && date.getTime() <= now.getTime()) {
    throw new Error('Planlı yayın tarihi gelecekte olmalıdır');
  }

  return { status, publishedAt: date.toISOString() };
}

export function isPubliclyVisible(
  item: { status: PublicationStatus; published_at: string | null },
  now = new Date()
): boolean {
  if (!['published', 'scheduled'].includes(item.status) || !item.published_at) {
    return false;
  }

  return new Date(item.published_at).getTime() <= now.getTime();
}

export function assertReasonableLinkCount(content: string, maximum = 2) {
  const links = content.match(/(?:https?:\/\/|www\.)/gi)?.length ?? 0;
  if (links > maximum) {
    throw new Error(`Bir iletide en fazla ${maximum} bağlantı paylaşabilirsiniz`);
  }
}

export function toDateTimeLocal(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}
