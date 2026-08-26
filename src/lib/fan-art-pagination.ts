import type {
  FanArtCursor,
  FanArtOwnCursor,
  FanArtOwnItem,
  FanArtOwnPage,
  FanArtPublicPage,
  FanArtPublicItem,
} from '@/lib/types';

export const FAN_ART_PAGE_SIZE = 12;
export const FAN_ART_OWN_PAGE_SIZE = 20;

const ISO_TIMESTAMP_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/;

function isValidTimestamp(value: string): boolean {
  const match = ISO_TIMESTAMP_PATTERN.exec(value);
  if (!match) return false;

  const [, yearValue, monthValue, dayValue, hourValue, minuteValue, secondValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const hour = Number(hourValue);
  const minute = Number(minuteValue);
  const second = Number(secondValue);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));

  return (
    hour <= 23 &&
    minute <= 59 &&
    second <= 59 &&
    calendarDate.getUTCFullYear() === year &&
    calendarDate.getUTCMonth() === month - 1 &&
    calendarDate.getUTCDate() === day &&
    !Number.isNaN(Date.parse(value))
  );
}

export function parseFanArtCursor(value: unknown): FanArtCursor | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Sayfalama bilgisi geçersiz');
  }

  const cursor = value as Record<string, unknown>;
  if (
    Object.keys(cursor).length !== 2 ||
    typeof cursor.moderatedAt !== 'string' ||
    !isValidTimestamp(cursor.moderatedAt) ||
    typeof cursor.id !== 'number' ||
    !Number.isSafeInteger(cursor.id) ||
    cursor.id <= 0
  ) {
    throw new Error('Sayfalama bilgisi geçersiz');
  }

  return { moderatedAt: cursor.moderatedAt, id: cursor.id };
}

export function fanArtCursorFilter(cursor: FanArtCursor): string {
  return `moderated_at.lt.${cursor.moderatedAt},and(moderated_at.eq.${cursor.moderatedAt},id.lt.${cursor.id})`;
}

export function parseFanArtOwnCursor(value: unknown): FanArtOwnCursor | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Sayfalama bilgisi geçersiz');
  }

  const cursor = value as Record<string, unknown>;
  if (
    Object.keys(cursor).length !== 2 ||
    typeof cursor.activityAt !== 'string' ||
    !isValidTimestamp(cursor.activityAt) ||
    typeof cursor.id !== 'number' ||
    !Number.isSafeInteger(cursor.id) ||
    cursor.id <= 0
  ) {
    throw new Error('Sayfalama bilgisi geçersiz');
  }

  return { activityAt: cursor.activityAt, id: cursor.id };
}

export function fanArtOwnCursorFilter(cursor: FanArtOwnCursor): string {
  return `activity_at.lt.${cursor.activityAt},and(activity_at.eq.${cursor.activityAt},id.lt.${cursor.id})`;
}

export function toFanArtPage(
  rows: Array<FanArtPublicItem & { moderatedAt: string }>
): FanArtPublicPage {
  const visibleRows = rows.slice(0, FAN_ART_PAGE_SIZE);
  const lastItem = visibleRows.at(-1);

  return {
    items: visibleRows.map(({ moderatedAt, ...item }) => {
      void moderatedAt;
      return item;
    }),
    nextCursor:
      rows.length > FAN_ART_PAGE_SIZE && lastItem
        ? { moderatedAt: lastItem.moderatedAt, id: lastItem.id }
        : null,
  };
}

export function toFanArtOwnPage(
  rows: Array<FanArtOwnItem & { activityAt: string }>
): FanArtOwnPage {
  const visibleRows = rows.slice(0, FAN_ART_OWN_PAGE_SIZE);
  const lastItem = visibleRows.at(-1);

  return {
    items: visibleRows.map(({ activityAt, ...item }) => {
      void activityAt;
      return item;
    }),
    nextCursor:
      rows.length > FAN_ART_OWN_PAGE_SIZE && lastItem
        ? { activityAt: lastItem.activityAt, id: lastItem.id }
        : null,
  };
}
