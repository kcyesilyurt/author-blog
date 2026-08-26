-- Count real page visits without letting repeated refreshes inflate totals.
-- Aggregate totals stay on the publication rows; the short-lived table only
-- remembers whether a target-scoped pseudonymous reader was counted recently.

begin;

alter table public.books
  add column if not exists view_count bigint not null default 0;

alter table public.chapters
  add column if not exists view_count bigint not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'books_view_count_nonnegative_check'
      and conrelid = 'public.books'::regclass
  ) then
    alter table public.books
      add constraint books_view_count_nonnegative_check
      check (view_count >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'chapters_view_count_nonnegative_check'
      and conrelid = 'public.chapters'::regclass
  ) then
    alter table public.chapters
      add constraint chapters_view_count_nonnegative_check
      check (view_count >= 0);
  end if;
end $$;

create table if not exists public.publication_view_dedup (
  id bigint generated always as identity primary key,
  book_id uuid references public.books(id) on delete cascade,
  chapter_id uuid references public.chapters(id) on delete cascade,
  actor_hash text not null,
  last_counted_at timestamptz not null default now(),
  constraint publication_view_dedup_one_target_check
    check ((book_id is not null) <> (chapter_id is not null)),
  constraint publication_view_dedup_actor_hash_check
    check (char_length(actor_hash) = 64)
);

alter table public.publication_view_dedup enable row level security;

revoke all on table public.publication_view_dedup
  from public, anon, authenticated;
revoke all on sequence public.publication_view_dedup_id_seq
  from public, anon, authenticated;

grant select, insert, update, delete on table public.publication_view_dedup
  to service_role;
grant usage, select on sequence public.publication_view_dedup_id_seq
  to service_role;

create unique index if not exists publication_view_dedup_book_actor_idx
  on public.publication_view_dedup (book_id, actor_hash)
  where book_id is not null;

create unique index if not exists publication_view_dedup_chapter_actor_idx
  on public.publication_view_dedup (chapter_id, actor_hash)
  where chapter_id is not null;

create index if not exists publication_view_dedup_last_counted_idx
  on public.publication_view_dedup (last_counted_at, id);

create or replace function public.record_publication_view(
  p_content_type text,
  p_content_id uuid,
  p_actor_hash text
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  counted_now boolean;
  current_count bigint;
  request_time timestamptz := pg_catalog.now();
begin
  if p_content_type is null
    or p_content_type not in ('book', 'chapter')
    or p_content_id is null
    or p_actor_hash is null
    or p_actor_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid publication view parameters';
  end if;

  if p_content_type = 'book' then
    perform 1
    from public.books
    where books.id = p_content_id
      and books.status in ('published', 'scheduled')
      and books.published_at <= request_time;

    if not found then
      raise exception 'publication not found';
    end if;

    with counted as (
      insert into public.publication_view_dedup as dedup (
        book_id,
        actor_hash,
        last_counted_at
      )
      values (p_content_id, p_actor_hash, request_time)
      on conflict (book_id, actor_hash) where book_id is not null
      do update
      set last_counted_at = excluded.last_counted_at
      where dedup.last_counted_at
        <= excluded.last_counted_at - interval '24 hours'
      returning 1
    )
    select exists (select 1 from counted)
    into counted_now;

    if counted_now then
      update public.books
      set view_count = view_count + 1
      where books.id = p_content_id
        and books.status in ('published', 'scheduled')
        and books.published_at <= request_time
      returning books.view_count into current_count;

      if not found then
        raise exception 'publication not found';
      end if;
    end if;

    select books.view_count
    into current_count
    from public.books
    where books.id = p_content_id
      and books.status in ('published', 'scheduled')
      and books.published_at <= request_time;

    if not found then
      raise exception 'publication not found';
    end if;
  else
    perform 1
    from public.chapters
    join public.books on books.id = chapters.book_id
    where chapters.id = p_content_id
      and chapters.status in ('published', 'scheduled')
      and chapters.published_at <= request_time
      and books.status in ('published', 'scheduled')
      and books.published_at <= request_time;

    if not found then
      raise exception 'publication not found';
    end if;

    with counted as (
      insert into public.publication_view_dedup as dedup (
        chapter_id,
        actor_hash,
        last_counted_at
      )
      values (p_content_id, p_actor_hash, request_time)
      on conflict (chapter_id, actor_hash) where chapter_id is not null
      do update
      set last_counted_at = excluded.last_counted_at
      where dedup.last_counted_at
        <= excluded.last_counted_at - interval '24 hours'
      returning 1
    )
    select exists (select 1 from counted)
    into counted_now;

    if counted_now then
      update public.chapters
      set view_count = view_count + 1
      where chapters.id = p_content_id
        and chapters.status in ('published', 'scheduled')
        and chapters.published_at <= request_time
        and exists (
          select 1
          from public.books
          where books.id = chapters.book_id
            and books.status in ('published', 'scheduled')
            and books.published_at <= request_time
        )
      returning chapters.view_count into current_count;

      if not found then
        raise exception 'publication not found';
      end if;
    end if;

    select chapters.view_count
    into current_count
    from public.chapters
    join public.books on books.id = chapters.book_id
    where chapters.id = p_content_id
      and chapters.status in ('published', 'scheduled')
      and chapters.published_at <= request_time
      and books.status in ('published', 'scheduled')
      and books.published_at <= request_time;

    if not found then
      raise exception 'publication not found';
    end if;
  end if;

  return current_count;
end;
$$;

revoke execute on function public.record_publication_view(text, uuid, text)
  from public, anon, authenticated;
grant execute on function public.record_publication_view(text, uuid, text)
  to service_role;

create or replace function public.prune_publication_view_dedup(
  p_batch_size integer default 5000
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  deleted_count integer;
begin
  if p_batch_size is null or p_batch_size not between 1 and 50000 then
    raise exception 'invalid cleanup batch size';
  end if;

  with expired as (
    select publication_view_dedup.id
    from public.publication_view_dedup
    where publication_view_dedup.last_counted_at
      < pg_catalog.now() - interval '30 days'
    order by publication_view_dedup.last_counted_at, publication_view_dedup.id
    limit p_batch_size
    for update skip locked
  ), deleted as (
    delete from public.publication_view_dedup
    using expired
    where publication_view_dedup.id = expired.id
    returning 1
  )
  select count(*)::integer
  into deleted_count
  from deleted;

  return deleted_count;
end;
$$;

revoke execute on function public.prune_publication_view_dedup(integer)
  from public, anon, authenticated;
grant execute on function public.prune_publication_view_dedup(integer)
  to service_role;

-- Supabase Cron is pg_cron under the hood. Scheduling in the migration keeps
-- the privacy-retention promise true even if nobody remembers a dashboard step.
create extension if not exists pg_cron;

select cron.schedule(
  'prune-publication-view-dedup-hourly',
  '17 * * * *',
  'select public.prune_publication_view_dedup(5000);'
);

commit;
