import type { Metadata } from 'next';
import EventCard from '@/components/EventCard';
import PageHeader from '@/components/PageHeader';
import { createClient } from '@/lib/supabase/server';
import { absoluteSiteUrl, SOCIAL_IMAGE_PATH } from '@/lib/site';
import type { Event } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Etkinlikler',
  description: 'Övgü Deveci Safi etkinlikleri, kitap fuarları ve imza günleri.',
  alternates: { canonical: '/etkinlikler' },
  openGraph: {
    title: 'Etkinlikler | Övgü Deveci Safi',
    description: 'Övgü Deveci Safi etkinlikleri, kitap fuarları ve imza günleri.',
    url: absoluteSiteUrl('/etkinlikler'),
    type: 'website',
    images: [{ url: SOCIAL_IMAGE_PATH, width: 1024, height: 682, alt: 'Övgü Deveci Safi' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Etkinlikler | Övgü Deveci Safi',
    description: 'Övgü Deveci Safi etkinlikleri, kitap fuarları ve imza günleri.',
    images: [SOCIAL_IMAGE_PATH],
  },
};

function getIstanbulToday(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Europe/Istanbul',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-2xl border border-[#64090C]/25 bg-[#64090C]/5 px-6 py-12 text-center">
      <span className="mb-4 block text-3xl text-[#F8D794]/45" aria-hidden="true">
        ✦
      </span>
      <p className="font-serif italic text-[#EFEACD]/45">{children}</p>
    </div>
  );
}

export default async function EventsPage() {
  let events: Event[] = [];
  let eventsAvailable = true;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'published')
      .order('event_date', { ascending: true });

    if (error) {
      eventsAvailable = false;
    } else {
      events = (data ?? []) as Event[];
    }
  } catch {
    eventsAvailable = false;
  }

  const today = getIstanbulToday();
  const upcomingEvents = events.filter((event) => event.event_date >= today);
  const pastEvents = events.filter((event) => event.event_date < today).reverse();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <PageHeader
        title="Etkinlikler"
        eyebrow="Takvim"
        description="Kitap fuarları, imza günleri ve okurlarla buluşacağım etkinlikler."
      />

      {!eventsAvailable ? (
        <EmptyState>Etkinlik takvimi şu anda hazırlanıyor.</EmptyState>
      ) : (
        <div className="space-y-16">
          <section aria-labelledby="upcoming-events-title">
            <h2
              id="upcoming-events-title"
              className="mb-6 font-serif text-2xl font-semibold text-[#EFEACD] sm:text-3xl"
            >
              Yaklaşan Etkinlikler
            </h2>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-5">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <EmptyState>Yaklaşan bir etkinlik henüz duyurulmadı.</EmptyState>
            )}
          </section>

          {pastEvents.length > 0 && (
            <section aria-labelledby="past-events-title">
              <h2
                id="past-events-title"
                className="mb-6 font-serif text-2xl font-semibold text-[#EFEACD] sm:text-3xl"
              >
                Geçmiş Etkinlikler
              </h2>
              <div className="space-y-5 opacity-80">
                {pastEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
