import type { Event } from '@/lib/types';

function formatEventDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Istanbul',
  }).format(date);
}

function formatEventTime(value: string | null): string | null {
  if (!value) return null;
  const match = /^(\d{2}):(\d{2})/.exec(value);
  return match ? `${match[1]}:${match[2]}` : value;
}

function getSafeExternalUrl(value: string | null): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export default function EventCard({ event }: { event: Event }) {
  const time = formatEventTime(event.event_time);
  const externalUrl = getSafeExternalUrl(event.external_url);

  return (
    <article className="bordeaux-card rounded-2xl p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="shrink-0 rounded-xl border border-[#F8D794]/15 bg-[#9C0512]/15 px-5 py-4 text-center sm:w-44">
          <time
            dateTime={`${event.event_date}${time ? `T${time}` : ''}`}
            className="block font-serif text-lg font-semibold leading-snug text-[#F8D794]"
          >
            {formatEventDate(event.event_date)}
          </time>
          {time && <span className="mt-2 block text-sm text-[#EFEACD]/55">Saat {time}</span>}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-2xl font-semibold text-[#EFEACD]">{event.title}</h3>
          {event.location && (
            <p className="mt-2 flex items-start gap-2 text-sm text-[#F8D794]/70">
              <span aria-hidden="true">◇</span>
              <span>{event.location}</span>
            </p>
          )}
          {event.description && (
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#EFEACD]/60 sm:text-base">
              {event.description}
            </p>
          )}
          {externalUrl && (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-[#F8D794]/25 px-4 py-2 text-sm font-medium text-[#F8D794] hover:bg-[#F8D794]/10"
            >
              Etkinlik ayrıntıları
              <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
