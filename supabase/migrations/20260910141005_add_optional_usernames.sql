begin;

alter table public.profiles
  add column if not exists username text;

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_constraint
    where conname = 'profiles_username_format_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_username_format_check
      check (
        username is null
        or (
          pg_catalog.char_length(username) between 3 and 24
          and username = pg_catalog.btrim(username)
          and username = pg_catalog.lower(username)
          and (username collate "C") ~ '^[a-z0-9][a-z0-9_]*[a-z0-9]$'
        )
      ) not valid;
  end if;
end
$$;

alter table public.profiles
  validate constraint profiles_username_format_check;

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_constraint
    where conname = 'profiles_username_reserved_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_username_reserved_check
      check (
        username is null
        or username not in (
          'admin',
          'administrator',
          'anonymous',
          'anonim',
          'author',
          'destek',
          'editor',
          'guest',
          'misafir',
          'mod',
          'moderator',
          'official',
          'okur',
          'owner',
          'resmi',
          'root',
          'sistem',
          'staff',
          'support',
          'system',
          'yazar',
          'yonetici',
          'yonetim'
        )
      ) not valid;
  end if;
end
$$;

alter table public.profiles
  validate constraint profiles_username_reserved_check;

create unique index if not exists profiles_username_lower_uidx
  on public.profiles ((pg_catalog.lower(username)))
  where username is not null;

comment on column public.profiles.username is
  'Optional public handle stored in lowercase without the leading @ character.';

-- Profile reads use column-level grants so private moderation state stays hidden.
grant select (username) on table public.profiles to anon, authenticated;

commit;
