-- Preserve the public event calendar and contact channel from the former
-- WordPress site. Public readers may only read published events; contact
-- messages are intentionally available to the trusted service role only.

begin;

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  location text not null,
  event_date date not null,
  event_time time without time zone,
  description text,
  external_url text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_slug_check
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint events_title_length_check
    check (char_length(btrim(title)) between 2 and 160),
  constraint events_location_length_check
    check (char_length(btrim(location)) between 2 and 200),
  constraint events_description_length_check
    check (description is null or char_length(description) <= 3000),
  constraint events_external_url_length_check
    check (external_url is null or char_length(external_url) <= 2048),
  constraint events_status_check
    check (status in ('draft', 'published', 'archived'))
);

alter table public.events enable row level security;

drop policy if exists "events_select_published" on public.events;

create policy "events_select_published"
on public.events
for select
to anon, authenticated
using (status = 'published');

revoke all on table public.events from public, anon, authenticated;
grant select on table public.events to anon, authenticated;
grant select, insert, update, delete on table public.events to service_role;

create index if not exists events_published_date_idx
  on public.events (event_date, id)
  where status = 'published';

-- These dates were published on the former WordPress site. Keeping them as
-- past events preserves the author's event archive after the domain cutover.
insert into public.events (
  slug,
  title,
  location,
  event_date,
  event_time,
  description,
  status
)
values
  (
    'denizli-kitap-fuari-2025',
    'Denizli Kitap Fuarı',
    'Denizli',
    date '2025-12-06',
    time '13:00',
    null,
    'published'
  ),
  (
    'istanbul-tuyap-kitap-fuari-2025',
    'İstanbul TÜYAP Kitap Fuarı',
    'İstanbul TÜYAP',
    date '2025-12-20',
    null,
    null,
    'published'
  )
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Contact inbox
-- ---------------------------------------------------------------------------

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint contact_messages_name_length_check
    check (char_length(btrim(name)) between 2 and 80),
  constraint contact_messages_email_length_check
    check (char_length(btrim(email)) between 3 and 254),
  constraint contact_messages_subject_length_check
    check (char_length(btrim(subject)) between 3 and 160),
  constraint contact_messages_message_length_check
    check (char_length(btrim(message)) between 10 and 5000)
);

alter table public.contact_messages enable row level security;

-- Deliberately create no browser-facing RLS policy. Even authenticated users
-- must not be able to enumerate messages or email addresses through the API.
revoke all on table public.contact_messages from public, anon, authenticated;
grant select, insert, update, delete on table public.contact_messages to service_role;

create index if not exists contact_messages_created_idx
  on public.contact_messages (created_at desc, id desc);

create index if not exists contact_messages_unread_idx
  on public.contact_messages (created_at desc, id desc)
  where read_at is null;

create index if not exists contact_messages_user_id_idx
  on public.contact_messages (user_id)
  where user_id is not null;

-- ---------------------------------------------------------------------------
-- Add the public contact form to the existing server-side rate limiter.
-- ---------------------------------------------------------------------------

alter table public.community_rate_limits
  drop constraint if exists community_rate_limits_action_check;

alter table public.community_rate_limits
  add constraint community_rate_limits_action_check
  check (action in ('comment', 'pano', 'reaction', 'avatar_upload', 'contact'));

create or replace function public.consume_community_rate_limit(
  p_actor_hash text,
  p_action text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  request_count integer;
  window_start timestamptz;
begin
  if char_length(p_actor_hash) <> 64
    or p_action not in ('comment', 'pano', 'reaction', 'avatar_upload', 'contact')
    or p_limit not between 1 and 1000
    or p_window_seconds not between 1 and 86400 then
    raise exception 'invalid rate limit parameters';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_actor_hash || ':' || p_action, 0)
  );

  window_start := pg_catalog.now() - pg_catalog.make_interval(secs => p_window_seconds);

  delete from public.community_rate_limits
  where actor_hash = p_actor_hash
    and action = p_action
    and created_at < window_start;

  select count(*)::integer
  into request_count
  from public.community_rate_limits
  where actor_hash = p_actor_hash
    and action = p_action
    and created_at >= window_start;

  if request_count >= p_limit then
    return false;
  end if;

  insert into public.community_rate_limits (actor_hash, action)
  values (p_actor_hash, p_action);

  return true;
end;
$$;

revoke execute on function public.consume_community_rate_limit(text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_community_rate_limit(text, text, integer, integer)
  to service_role;

commit;
