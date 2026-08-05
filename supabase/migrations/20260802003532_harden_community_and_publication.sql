-- Harden authorization, move community writes behind trusted server actions,
-- and add an explicit publication workflow without hiding existing content.

-- ---------------------------------------------------------------------------
-- Publication state
-- ---------------------------------------------------------------------------

alter table public.books
  add column if not exists status text,
  add column if not exists published_at timestamptz;

update public.books
set
  status = coalesce(status, 'published'),
  published_at = coalesce(published_at, created_at, now())
where status is null or published_at is null;

alter table public.books
  alter column status set default 'draft',
  alter column status set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'books_status_check'
      and conrelid = 'public.books'::regclass
  ) then
    alter table public.books
      add constraint books_status_check
      check (status in ('draft', 'scheduled', 'published', 'archived'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'books_publication_date_check'
      and conrelid = 'public.books'::regclass
  ) then
    alter table public.books
      add constraint books_publication_date_check
      check (
        status in ('draft', 'archived')
        or published_at is not null
      );
  end if;
end $$;

alter table public.chapters
  add column if not exists status text,
  add column if not exists published_at timestamptz;

update public.chapters
set
  status = coalesce(status, 'published'),
  published_at = coalesce(published_at, created_at, now())
where status is null or published_at is null;

alter table public.chapters
  alter column status set default 'draft',
  alter column status set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chapters_status_check'
      and conrelid = 'public.chapters'::regclass
  ) then
    alter table public.chapters
      add constraint chapters_status_check
      check (status in ('draft', 'scheduled', 'published', 'archived'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'chapters_publication_date_check'
      and conrelid = 'public.chapters'::regclass
  ) then
    alter table public.chapters
      add constraint chapters_publication_date_check
      check (
        status in ('draft', 'archived')
        or published_at is not null
      );
  end if;
end $$;

create index if not exists books_publication_idx
  on public.books (status, published_at desc, created_at desc);

create index if not exists chapters_book_publication_idx
  on public.chapters (book_id, status, published_at, chapter_order);

-- ---------------------------------------------------------------------------
-- Profile privilege escalation protection
-- ---------------------------------------------------------------------------

-- Some existing deployments were created before the role columns were added.
-- Keep this hardening migration self-contained and safe to rerun.
alter table public.profiles
  add column if not exists is_admin boolean,
  add column if not exists is_banned boolean;

update public.profiles
set
  is_admin = coalesce(is_admin, false),
  is_banned = coalesce(is_banned, false)
where is_admin is null or is_banned is null;

alter table public.profiles
  alter column is_admin set default false,
  alter column is_admin set not null,
  alter column is_banned set default false,
  alter column is_banned set not null;

drop policy if exists "profiles_update_policy" on public.profiles;
drop policy if exists "profiles_insert_policy" on public.profiles;
drop policy if exists "profiles_update_own_public_fields" on public.profiles;

revoke insert, update on table public.profiles from anon, authenticated;
revoke select on table public.profiles from anon, authenticated;

grant select (
  id,
  display_name,
  first_name,
  last_name,
  avatar_url,
  is_admin,
  created_at
) on public.profiles to anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    display_name,
    first_name,
    last_name,
    avatar_url
  )
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'display_name', ''),
      split_part(new.email, '@', 1)
    ),
    nullif(new.raw_user_meta_data->>'first_name', ''),
    nullif(new.raw_user_meta_data->>'last_name', ''),
    nullif(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin, service_role;

-- ---------------------------------------------------------------------------
-- Public content visibility
-- ---------------------------------------------------------------------------

drop policy if exists "books_select_policy" on public.books;
drop policy if exists "books_select_published" on public.books;
drop policy if exists "books_select_admin" on public.books;

create policy "books_select_published"
on public.books
for select
to anon, authenticated
using (
  status in ('published', 'scheduled')
  and published_at <= now()
);

create policy "books_select_admin"
on public.books
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.is_admin = true
  )
);

drop policy if exists "chapters_select_policy" on public.chapters;
drop policy if exists "chapters_select_published" on public.chapters;
drop policy if exists "chapters_select_admin" on public.chapters;

create policy "chapters_select_published"
on public.chapters
for select
to anon, authenticated
using (
  status in ('published', 'scheduled')
  and published_at <= now()
  and exists (
    select 1
    from public.books
    where books.id = chapters.book_id
      and books.status in ('published', 'scheduled')
      and books.published_at <= now()
  )
);

create policy "chapters_select_admin"
on public.chapters
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.is_admin = true
  )
);

revoke insert, update, delete on table public.books from anon, authenticated;
revoke insert, update, delete on table public.chapters from anon, authenticated;
grant select on table public.books to anon, authenticated;
grant select on table public.chapters to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Community writes: only trusted server actions (service role) may mutate.
-- Read access remains public for published content and the independent board.
-- ---------------------------------------------------------------------------

drop policy if exists "comments_insert_auth_policy" on public.comments;
drop policy if exists "comments_insert_anon_policy" on public.comments;
drop policy if exists "comments_select_policy" on public.comments;
drop policy if exists "comments_select_public" on public.comments;
drop policy if exists "comments_select_published" on public.comments;
drop policy if exists "comments_select_admin" on public.comments;

create policy "comments_select_published"
on public.comments
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.chapters
    join public.books on books.id = chapters.book_id
    where chapters.id = comments.chapter_id
      and chapters.status in ('published', 'scheduled')
      and chapters.published_at <= now()
      and books.status in ('published', 'scheduled')
      and books.published_at <= now()
  )
);

create policy "comments_select_admin"
on public.comments
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.is_admin = true
  )
);

drop policy if exists "reactions_insert_auth_policy" on public.reactions;
drop policy if exists "reactions_insert_anon_policy" on public.reactions;
drop policy if exists "reactions_delete_auth_policy" on public.reactions;
drop policy if exists "reactions_delete_anon_policy" on public.reactions;
drop policy if exists "reactions_select_policy" on public.reactions;
drop policy if exists "reactions_select_published" on public.reactions;
drop policy if exists "reactions_select_admin" on public.reactions;

create policy "reactions_select_published"
on public.reactions
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.chapters
    join public.books on books.id = chapters.book_id
    where chapters.id = reactions.chapter_id
      and chapters.status in ('published', 'scheduled')
      and chapters.published_at <= now()
      and books.status in ('published', 'scheduled')
      and books.published_at <= now()
  )
);

create policy "reactions_select_admin"
on public.reactions
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.is_admin = true
  )
);

drop policy if exists "pano_insert_auth_policy" on public.pano_messages;
drop policy if exists "pano_insert_anon_policy" on public.pano_messages;
drop policy if exists "pano_delete_auth_policy" on public.pano_messages;

revoke insert, update, delete on table public.comments from anon, authenticated;
revoke insert, update, delete on table public.reactions from anon, authenticated;
revoke insert, update, delete on table public.pano_messages from anon, authenticated;

grant select on table public.comments to anon, authenticated;
grant select on table public.reactions to anon, authenticated;
grant select on table public.pano_messages to anon, authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'comments_content_length_check'
      and conrelid = 'public.comments'::regclass
  ) then
    alter table public.comments
      add constraint comments_content_length_check
      check (char_length(btrim(content)) between 1 and 2000)
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'comments_exactly_one_actor_check'
      and conrelid = 'public.comments'::regclass
  ) then
    alter table public.comments
      add constraint comments_exactly_one_actor_check
      check ((user_id is not null) <> (guest_name is not null))
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'comments_guest_name_length_check'
      and conrelid = 'public.comments'::regclass
  ) then
    alter table public.comments
      add constraint comments_guest_name_length_check
      check (guest_name is null or char_length(btrim(guest_name)) between 2 and 50)
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'pano_messages_exactly_one_actor_check'
      and conrelid = 'public.pano_messages'::regclass
  ) then
    alter table public.pano_messages
      add constraint pano_messages_exactly_one_actor_check
      check ((user_id is not null) <> (guest_name is not null))
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'pano_messages_content_length_check'
      and conrelid = 'public.pano_messages'::regclass
  ) then
    alter table public.pano_messages
      add constraint pano_messages_content_length_check
      check (char_length(btrim(content)) between 1 and 2000)
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'pano_messages_guest_name_length_check'
      and conrelid = 'public.pano_messages'::regclass
  ) then
    alter table public.pano_messages
      add constraint pano_messages_guest_name_length_check
      check (guest_name is null or char_length(btrim(guest_name)) between 2 and 50)
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'reactions_exactly_one_actor_check'
      and conrelid = 'public.reactions'::regclass
  ) then
    alter table public.reactions
      add constraint reactions_exactly_one_actor_check
      check ((user_id is not null) <> (guest_identifier is not null))
      not valid;
  end if;
end $$;

create index if not exists pano_messages_created_id_idx
  on public.pano_messages (created_at desc, id desc);

create index if not exists comments_user_id_idx
  on public.comments (user_id)
  where user_id is not null;

create index if not exists reactions_user_id_idx
  on public.reactions (user_id)
  where user_id is not null;

create index if not exists pano_messages_user_id_idx
  on public.pano_messages (user_id)
  where user_id is not null;

-- ---------------------------------------------------------------------------
-- Server-side rate limiting. This table is intentionally unavailable to
-- browser roles; only the service role used by trusted server actions can use it.
-- ---------------------------------------------------------------------------

create table if not exists public.community_rate_limits (
  id bigint generated always as identity primary key,
  actor_hash text not null check (char_length(actor_hash) = 64),
  action text not null check (action in ('comment', 'pano', 'reaction', 'avatar_upload')),
  created_at timestamptz not null default now()
);

alter table public.community_rate_limits enable row level security;

revoke all on table public.community_rate_limits from public, anon, authenticated;
revoke all on sequence public.community_rate_limits_id_seq from public, anon, authenticated;
grant select, insert, delete on table public.community_rate_limits to service_role;
grant usage, select on sequence public.community_rate_limits_id_seq to service_role;

create index if not exists community_rate_limits_actor_action_created_idx
  on public.community_rate_limits (actor_hash, action, created_at desc);

create index if not exists community_rate_limits_created_idx
  on public.community_rate_limits (created_at);

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
    or p_action not in ('comment', 'pano', 'reaction', 'avatar_upload')
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

-- Explicit service-role grants keep this migration compatible with Supabase's
-- 2026 Data API opt-in defaults for newly created tables.
grant usage on schema public to service_role;
grant select, insert, update, delete on table
  public.books,
  public.chapters,
  public.comments,
  public.reactions,
  public.pano_messages,
  public.profiles
to service_role;

-- ---------------------------------------------------------------------------
-- Storage buckets. Uploads still go through authenticated server actions;
-- public=true only controls read access to the resulting image URLs.
-- ---------------------------------------------------------------------------

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  (
    'covers',
    'covers',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'avatars',
    'avatars',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
