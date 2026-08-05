import type { CommunityCursor, CommunityPage } from '@/lib/types';

export const COMMUNITY_PAGE_SIZE = 20;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_TIMESTAMP_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/;

function isValidTimestamp(value: string) {
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

export function parseCommunityCursor(value: unknown): CommunityCursor | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Sayfalama bilgisi geçersiz');
  }

  const cursor = value as Record<string, unknown>;
  const keys = Object.keys(cursor);
  if (
    keys.length !== 2 ||
    !keys.includes('createdAt') ||
    !keys.includes('id') ||
    typeof cursor.createdAt !== 'string' ||
    typeof cursor.id !== 'string' ||
    !isValidTimestamp(cursor.createdAt) ||
    !UUID_PATTERN.test(cursor.id)
  ) {
    throw new Error('Sayfalama bilgisi geçersiz');
  }

  return { createdAt: cursor.createdAt, id: cursor.id.toLowerCase() };
}

export function communityCursorFilter(cursor: CommunityCursor): string {
  return `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`;
}

export function toCommunityPage<T extends { id: string; created_at: string }>(
  rows: T[]
): CommunityPage<T> {
  const items = rows.slice(0, COMMUNITY_PAGE_SIZE);
  const lastItem = items.at(-1);

  return {
    items,
    nextCursor:
      rows.length > COMMUNITY_PAGE_SIZE && lastItem
        ? { createdAt: lastItem.created_at, id: lastItem.id }
        : null,
  };
}

export function appendUniqueById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const existingIds = new Set(current.map((item) => item.id));
  const additions = incoming.filter((item) => {
    if (existingIds.has(item.id)) return false;
    existingIds.add(item.id);
    return true;
  });
  return [...current, ...additions];
}

export function prependUniqueById<T extends { id: string }>(current: T[], item: T): T[] {
  return [item, ...current.filter((currentItem) => currentItem.id !== item.id)];
}
