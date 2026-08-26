-- Moderated fan art: original uploads wait in a private bucket. Only a
-- server-sanitized WebP derivative can be approved into the public bucket.

begin;

create table if not exists public.fan_art_submissions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  caption text,
  alt_text text not null,
  status text not null default 'uploading',
  processing_started_at timestamptz,
  processing_token uuid,
  upload_path text unique,
  staging_path text unique,
  public_path text unique,
  mime_type text not null,
  size_bytes bigint not null,
  width integer,
  height integer,
  rights_confirmed_at timestamptz not null default now(),
  terms_version text not null,
  created_at timestamptz not null default now(),
  activity_at timestamptz not null default now(),
  submitted_at timestamptz,
  moderated_at timestamptz,
  moderated_by uuid references public.profiles(id) on delete set null,
  rejection_reason text,
  removed_at timestamptz,
  removed_by uuid references public.profiles(id) on delete set null,
  removal_reason text,
  constraint fan_art_title_length_check
    check (char_length(btrim(title)) between 2 and 100),
  constraint fan_art_caption_length_check
    check (caption is null or char_length(caption) <= 500),
  constraint fan_art_alt_text_length_check
    check (char_length(btrim(alt_text)) between 5 and 180),
  constraint fan_art_status_check
    check (
      status in (
        'uploading',
        'processing',
        'cancelled',
        'pending',
        'approved',
        'rejected',
        'removed'
      )
    ),
  constraint fan_art_object_path_length_check
    check (
      (upload_path is null or char_length(upload_path) between 3 and 300)
      and (staging_path is null or char_length(staging_path) between 3 and 300)
      and (public_path is null or char_length(public_path) between 3 and 300)
    ),
  constraint fan_art_mime_type_check
    check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  constraint fan_art_size_check
    check (size_bytes between 1 and 6291456),
  constraint fan_art_dimensions_check
    check (
      (width is null and height is null)
      or (width between 1 and 2400 and height between 1 and 2400)
    ),
  constraint fan_art_terms_version_length_check
    check (char_length(terms_version) between 1 and 40),
  constraint fan_art_rejection_reason_length_check
    check (
      rejection_reason is null
      or char_length(btrim(rejection_reason)) between 2 and 500
    ),
  constraint fan_art_removal_reason_length_check
    check (
      removal_reason is null
      or char_length(btrim(removal_reason)) between 2 and 500
    ),
  constraint fan_art_removal_shape_check
    check (
      (
        status = 'removed'
        and removed_at is not null
        and removal_reason is not null
      )
      or (
        status <> 'removed'
        and removed_at is null
        and removed_by is null
        and removal_reason is null
      )
    ),
  constraint fan_art_state_shape_check
    check (
      (
        status = 'uploading'
        and upload_path is not null
        and staging_path is not null
        and staging_path = upload_path
        and public_path is null
        and width is null
        and height is null
        and submitted_at is null
        and moderated_at is null
        and rejection_reason is null
        and processing_started_at is null
        and processing_token is null
      )
      or (
        status = 'processing'
        and upload_path is not null
        and staging_path is not null
        and staging_path = upload_path
        and public_path is null
        and width is null
        and height is null
        and submitted_at is null
        and moderated_at is null
        and rejection_reason is null
        and processing_started_at is not null
        and processing_token is not null
      )
      or (
        status = 'cancelled'
        and upload_path is not null
        and staging_path is not null
        and staging_path = upload_path
        and public_path is null
        and width is null
        and height is null
        and submitted_at is null
        and moderated_at is null
        and rejection_reason is null
        and processing_started_at is null
        and processing_token is null
      )
      or (
        status = 'removed'
        and public_path is null
        and width is not null
        and height is not null
        and submitted_at is not null
        and moderated_at is not null
        and rejection_reason is null
        and processing_started_at is null
        and processing_token is null
      )
      or (
        status = 'pending'
        and staging_path is not null
        and (upload_path is null or upload_path <> staging_path)
        and public_path is null
        and width is not null
        and height is not null
        and submitted_at is not null
        and moderated_at is null
        and rejection_reason is null
        and processing_started_at is null
        and processing_token is null
      )
      or (
        status = 'approved'
        and public_path is not null
        and width is not null
        and height is not null
        and submitted_at is not null
        and moderated_at is not null
        and rejection_reason is null
        and processing_started_at is null
        and processing_token is null
      )
      or (
        status = 'rejected'
        and public_path is null
        and width is not null
        and height is not null
        and submitted_at is not null
        and moderated_at is not null
        and rejection_reason is not null
        and processing_started_at is null
        and processing_token is null
      )
    )
);

alter table public.fan_art_submissions enable row level security;

-- The browser never reads raw paths or writes moderation state. Public and
-- owner-specific DTOs are shaped by authenticated server actions instead.
revoke all on table public.fan_art_submissions
  from public, anon, authenticated;
revoke all on sequence public.fan_art_submissions_id_seq
  from public, anon, authenticated;

grant select, insert, update, delete on table public.fan_art_submissions
  to service_role;
grant usage, select on sequence public.fan_art_submissions_id_seq
  to service_role;

create index if not exists fan_art_approved_cursor_idx
  on public.fan_art_submissions (moderated_at desc, id desc)
  where status = 'approved';

create index if not exists fan_art_pending_queue_idx
  on public.fan_art_submissions (submitted_at, id)
  where status = 'pending';

create index if not exists fan_art_user_activity_idx
  on public.fan_art_submissions (user_id, activity_at desc, id desc)
  where status in ('pending', 'approved', 'rejected', 'removed');

create index if not exists fan_art_user_active_upload_idx
  on public.fan_art_submissions (user_id, created_at)
  where status in ('uploading', 'processing', 'pending');

create index if not exists fan_art_moderated_by_idx
  on public.fan_art_submissions (moderated_by)
  where moderated_by is not null;

create index if not exists fan_art_removed_by_idx
  on public.fan_art_submissions (removed_by)
  where removed_by is not null;

-- Storage and Postgres cannot share a transaction. This durable outbox keeps
-- every provisional or expiring object discoverable until deletion succeeds.
create table if not exists public.fan_art_storage_cleanup_jobs (
  id bigint generated always as identity primary key,
  bucket_id text not null,
  object_path text not null,
  delete_after timestamptz not null,
  attempts integer not null default 0,
  last_error text,
  cleanup_started_at timestamptz,
  cleanup_token uuid,
  created_at timestamptz not null default now(),
  constraint fan_art_cleanup_bucket_check
    check (bucket_id in ('fan-art-staging', 'fan-art')),
  constraint fan_art_cleanup_path_length_check
    check (char_length(object_path) between 3 and 300),
  constraint fan_art_cleanup_attempts_check
    check (attempts >= 0),
  constraint fan_art_cleanup_last_error_length_check
    check (last_error is null or char_length(last_error) <= 1000),
  constraint fan_art_cleanup_claim_shape_check
    check (
      (cleanup_started_at is null and cleanup_token is null)
      or (cleanup_started_at is not null and cleanup_token is not null)
    ),
  constraint fan_art_cleanup_object_unique
    unique (bucket_id, object_path)
);

alter table public.fan_art_storage_cleanup_jobs enable row level security;

revoke all on table public.fan_art_storage_cleanup_jobs
  from public, anon, authenticated;
revoke all on sequence public.fan_art_storage_cleanup_jobs_id_seq
  from public, anon, authenticated;

grant select, insert, update, delete on table public.fan_art_storage_cleanup_jobs
  to service_role;
grant usage, select on sequence public.fan_art_storage_cleanup_jobs_id_seq
  to service_role;

create index if not exists fan_art_cleanup_due_idx
  on public.fan_art_storage_cleanup_jobs (delete_after, id);

-- Claiming a cleanup job and detaching its database pointers happen in one
-- transaction. Row locks serialize cleanup against finalize/approval so a
-- worker never deletes an object that just became live. The outbox row remains
-- durable until the Storage API confirms deletion.
create or replace function public.claim_fan_art_storage_cleanup(
  p_job_id bigint,
  p_cleanup_token uuid
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  claimed_job_id bigint;
  job_bucket text;
  job_path text;
begin
  if p_cleanup_token is null then
    raise exception 'fan art cleanup token is required';
  end if;

  select
    fan_art_storage_cleanup_jobs.bucket_id,
    fan_art_storage_cleanup_jobs.object_path
  into job_bucket, job_path
  from public.fan_art_storage_cleanup_jobs
  where fan_art_storage_cleanup_jobs.id = p_job_id
    and fan_art_storage_cleanup_jobs.delete_after <= pg_catalog.now()
    and (
      fan_art_storage_cleanup_jobs.cleanup_token is null
      or fan_art_storage_cleanup_jobs.cleanup_started_at
        < pg_catalog.now() - interval '10 minutes'
    )
  for update;

  if not found then
    return null;
  end if;

  if job_bucket = 'fan-art-staging' then
    perform 1
    from public.fan_art_submissions
    where fan_art_submissions.upload_path = job_path
      or fan_art_submissions.staging_path = job_path
    for update;

    if exists (
      select 1
      from public.fan_art_submissions
      where fan_art_submissions.status = 'processing'
        and fan_art_submissions.processing_started_at
          >= pg_catalog.now() - interval '10 minutes'
        and (
          fan_art_submissions.upload_path = job_path
          or fan_art_submissions.staging_path = job_path
        )
    ) or exists (
      select 1
      from public.fan_art_submissions
      where fan_art_submissions.status = 'pending'
        and fan_art_submissions.staging_path = job_path
    ) then
      update public.fan_art_storage_cleanup_jobs
      set
        delete_after = pg_catalog.now() + interval '15 minutes',
        cleanup_started_at = null,
        cleanup_token = null
      where fan_art_storage_cleanup_jobs.id = p_job_id;
      return null;
    end if;

    delete from public.fan_art_submissions
    where fan_art_submissions.upload_path = job_path
      and (
        fan_art_submissions.status in ('uploading', 'cancelled')
        or (
          fan_art_submissions.status = 'processing'
          and fan_art_submissions.processing_started_at
            < pg_catalog.now() - interval '10 minutes'
        )
      );

    update public.fan_art_submissions
    set upload_path = null
    where fan_art_submissions.upload_path = job_path
      and fan_art_submissions.status in (
        'pending',
        'approved',
        'rejected',
        'removed'
      );

    update public.fan_art_submissions
    set staging_path = null
    where fan_art_submissions.staging_path = job_path
      and fan_art_submissions.status in ('approved', 'rejected', 'removed');
  elsif job_bucket = 'fan-art' then
    perform 1
    from public.fan_art_submissions
    where fan_art_submissions.public_path = job_path
    for update;

    if exists (
      select 1
      from public.fan_art_submissions
      where fan_art_submissions.status = 'approved'
        and fan_art_submissions.public_path = job_path
    ) then
      update public.fan_art_storage_cleanup_jobs
      set
        delete_after = pg_catalog.now() + interval '15 minutes',
        cleanup_started_at = null,
        cleanup_token = null
      where fan_art_storage_cleanup_jobs.id = p_job_id;
      return null;
    end if;
  else
    raise exception 'unsupported fan art cleanup bucket';
  end if;

  update public.fan_art_storage_cleanup_jobs
  set
    cleanup_started_at = pg_catalog.now(),
    cleanup_token = p_cleanup_token
  where fan_art_storage_cleanup_jobs.id = p_job_id
  returning fan_art_storage_cleanup_jobs.id into claimed_job_id;

  return claimed_job_id;
end;
$$;

revoke execute on function public.claim_fan_art_storage_cleanup(bigint, uuid)
  from public, anon, authenticated;
grant execute on function public.claim_fan_art_storage_cleanup(bigint, uuid)
  to service_role;

-- Count and insert share one user-scoped transaction lock, so parallel ticket
-- requests cannot race past the five-active-submission quota.
create or replace function public.reserve_fan_art_submission(
  p_user_id uuid,
  p_title text,
  p_caption text,
  p_alt_text text,
  p_upload_path text,
  p_mime_type text,
  p_size_bytes bigint,
  p_terms_version text
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  submission_id bigint;
begin
  if p_user_id is null or p_upload_path is null then
    raise exception 'invalid fan art reservation parameters';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('fan-art-reservation:' || p_user_id::text, 0)
  );

  if (
    select count(*)
    from public.fan_art_submissions
    where fan_art_submissions.user_id = p_user_id
      and fan_art_submissions.status in ('uploading', 'processing', 'pending')
  ) >= 5 then
    raise exception 'fan art active submission limit reached';
  end if;

  insert into public.fan_art_submissions (
    user_id,
    title,
    caption,
    alt_text,
    status,
    upload_path,
    staging_path,
    mime_type,
    size_bytes,
    terms_version
  )
  values (
    p_user_id,
    p_title,
    p_caption,
    p_alt_text,
    'uploading',
    p_upload_path,
    p_upload_path,
    p_mime_type,
    p_size_bytes,
    p_terms_version
  )
  returning fan_art_submissions.id into submission_id;

  insert into public.fan_art_storage_cleanup_jobs (
    bucket_id,
    object_path,
    delete_after
  )
  values (
    'fan-art-staging',
    p_upload_path,
    pg_catalog.now() + interval '3 hours'
  );

  return submission_id;
end;
$$;

revoke execute on function public.reserve_fan_art_submission(
  uuid, text, text, text, text, text, bigint, text
) from public, anon, authenticated;
grant execute on function public.reserve_fan_art_submission(
  uuid, text, text, text, text, text, bigint, text
) to service_role;

-- Processing is a renewable claim rather than a permanent state. A crashed
-- request can be recovered after ten minutes, while the random token prevents
-- the old request from releasing or committing the newer request's claim.
create or replace function public.claim_fan_art_processing(
  p_submission_id bigint,
  p_user_id uuid,
  p_upload_path text,
  p_processing_token uuid
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  submission_id bigint;
begin
  if p_processing_token is null then
    raise exception 'fan art processing token is required';
  end if;

  update public.fan_art_submissions
  set
    status = 'processing',
    processing_started_at = pg_catalog.now(),
    processing_token = p_processing_token
  where fan_art_submissions.id = p_submission_id
    and fan_art_submissions.user_id = p_user_id
    and fan_art_submissions.upload_path = p_upload_path
    and fan_art_submissions.staging_path = p_upload_path
    and (
      fan_art_submissions.status = 'uploading'
      or (
        fan_art_submissions.status = 'processing'
        and fan_art_submissions.processing_started_at
          < pg_catalog.now() - interval '10 minutes'
      )
    )
  returning fan_art_submissions.id into submission_id;

  return submission_id;
end;
$$;

revoke execute on function public.claim_fan_art_processing(bigint, uuid, text, uuid)
  from public, anon, authenticated;
grant execute on function public.claim_fan_art_processing(bigint, uuid, text, uuid)
  to service_role;

create or replace function public.mark_fan_art_pending(
  p_submission_id bigint,
  p_user_id uuid,
  p_upload_path text,
  p_processing_token uuid,
  p_staging_path text,
  p_size_bytes bigint,
  p_width integer,
  p_height integer
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  submission_id bigint;
begin
  delete from public.fan_art_storage_cleanup_jobs
  where bucket_id = 'fan-art-staging'
    and object_path = p_staging_path
    and cleanup_token is null;

  if not found then
    raise exception 'fan art derivative cleanup claim not found';
  end if;

  update public.fan_art_submissions
  set
    status = 'pending',
    staging_path = p_staging_path,
    mime_type = 'image/webp',
    size_bytes = p_size_bytes,
    width = p_width,
    height = p_height,
    submitted_at = pg_catalog.now(),
    activity_at = pg_catalog.now(),
    processing_started_at = null,
    processing_token = null
  where fan_art_submissions.id = p_submission_id
    and fan_art_submissions.user_id = p_user_id
    and fan_art_submissions.status = 'processing'
    and fan_art_submissions.upload_path = p_upload_path
    and fan_art_submissions.processing_token = p_processing_token
  returning fan_art_submissions.id into submission_id;

  if not found then
    raise exception 'fan art processing claim not found';
  end if;

  return submission_id;
end;
$$;

revoke execute on function public.mark_fan_art_pending(
  bigint, uuid, text, uuid, text, bigint, integer, integer
) from public, anon, authenticated;
grant execute on function public.mark_fan_art_pending(
  bigint, uuid, text, uuid, text, bigint, integer, integer
) to service_role;

create or replace function public.approve_fan_art_submission(
  p_submission_id bigint,
  p_moderated_by uuid,
  p_public_path text
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  cleanup_job_id bigint;
  private_path text;
  submission_id bigint;
begin
  delete from public.fan_art_storage_cleanup_jobs
  where bucket_id = 'fan-art'
    and object_path = p_public_path
    and cleanup_token is null
  returning fan_art_storage_cleanup_jobs.id into cleanup_job_id;

  if not found then
    raise exception 'fan art public cleanup claim not found';
  end if;

  update public.fan_art_submissions
  set
    status = 'approved',
    public_path = p_public_path,
    moderated_at = pg_catalog.now(),
    activity_at = pg_catalog.now(),
    moderated_by = p_moderated_by,
    rejection_reason = null
  where fan_art_submissions.id = p_submission_id
    and fan_art_submissions.status = 'pending'
  returning fan_art_submissions.id, fan_art_submissions.staging_path
  into submission_id, private_path;

  if not found or private_path is null then
    raise exception 'pending fan art submission not found';
  end if;

  insert into public.fan_art_storage_cleanup_jobs (
    bucket_id,
    object_path,
    delete_after
  )
  values ('fan-art-staging', private_path, pg_catalog.now());

  return submission_id;
end;
$$;

revoke execute on function public.approve_fan_art_submission(bigint, uuid, text)
  from public, anon, authenticated;
grant execute on function public.approve_fan_art_submission(bigint, uuid, text)
  to service_role;

create or replace function public.reject_fan_art_submission(
  p_submission_id bigint,
  p_moderated_by uuid,
  p_reason text
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  private_path text;
  submission_id bigint;
begin
  update public.fan_art_submissions
  set
    status = 'rejected',
    public_path = null,
    moderated_at = pg_catalog.now(),
    activity_at = pg_catalog.now(),
    moderated_by = p_moderated_by,
    rejection_reason = p_reason
  where fan_art_submissions.id = p_submission_id
    and fan_art_submissions.status = 'pending'
  returning fan_art_submissions.id, fan_art_submissions.staging_path
  into submission_id, private_path;

  if not found or private_path is null then
    raise exception 'pending fan art submission not found';
  end if;

  insert into public.fan_art_storage_cleanup_jobs (
    bucket_id,
    object_path,
    delete_after
  )
  values ('fan-art-staging', private_path, pg_catalog.now());

  return submission_id;
end;
$$;

revoke execute on function public.reject_fan_art_submission(bigint, uuid, text)
  from public, anon, authenticated;
grant execute on function public.reject_fan_art_submission(bigint, uuid, text)
  to service_role;

create or replace function public.take_down_fan_art_submission(
  p_submission_id bigint,
  p_removed_by uuid,
  p_reason text
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  published_path text;
  submission_id bigint;
  submission_status text;
begin
  select
    fan_art_submissions.id,
    fan_art_submissions.status,
    fan_art_submissions.public_path
  into submission_id, submission_status, published_path
  from public.fan_art_submissions
  where fan_art_submissions.id = p_submission_id
  for update;

  if not found then
    raise exception 'fan art submission not found';
  end if;

  if submission_status = 'removed' then
    return submission_id;
  end if;

  if submission_status <> 'approved' or published_path is null then
    raise exception 'approved fan art submission not found';
  end if;

  update public.fan_art_submissions
  set
    status = 'removed',
    public_path = null,
    removed_at = pg_catalog.now(),
    activity_at = pg_catalog.now(),
    removed_by = p_removed_by,
    removal_reason = p_reason
  where fan_art_submissions.id = p_submission_id;

  insert into public.fan_art_storage_cleanup_jobs (
    bucket_id,
    object_path,
    delete_after
  )
  values ('fan-art', published_path, pg_catalog.now());

  return submission_id;
end;
$$;

revoke execute on function public.take_down_fan_art_submission(bigint, uuid, text)
  from public, anon, authenticated;
grant execute on function public.take_down_fan_art_submission(bigint, uuid, text)
  to service_role;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  (
    'fan-art-staging',
    'fan-art-staging',
    false,
    6291456,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'fan-art',
    'fan-art',
    true,
    6291456,
    array['image/webp']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Add fan art tickets to the existing account/IP rate limiter. The binary
-- itself still goes directly to Storage, so it never crosses a Server Action.
alter table public.community_rate_limits
  drop constraint if exists community_rate_limits_action_check;

alter table public.community_rate_limits
  add constraint community_rate_limits_action_check
  check (
    action in (
      'comment',
      'pano',
      'reaction',
      'avatar_upload',
      'contact',
      'fan_art_upload'
    )
  );

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
  if p_actor_hash is null
    or p_action is null
    or p_limit is null
    or p_window_seconds is null
    or char_length(p_actor_hash) <> 64
    or p_action not in (
      'comment',
      'pano',
      'reaction',
      'avatar_upload',
      'contact',
      'fan_art_upload'
    )
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
