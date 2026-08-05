-- 1. Ensure RLS policies on profiles, comments, and pano_messages allow public SELECT for everyone (anon + authenticated)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pano_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
CREATE POLICY "profiles_select_public" ON public.profiles FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "comments_select_policy" ON public.comments;
DROP POLICY IF EXISTS "comments_select_public" ON public.comments;
CREATE POLICY "comments_select_public" ON public.comments FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "pano_select_policy" ON public.pano_messages;
DROP POLICY IF EXISTS "pano_select_public" ON public.pano_messages;
CREATE POLICY "pano_select_public" ON public.pano_messages FOR SELECT TO public USING (true);

-- 2. Grant explicit SELECT permissions to anon and authenticated roles
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT SELECT ON public.comments TO anon, authenticated;
GRANT SELECT ON public.pano_messages TO anon, authenticated;

-- 3. Backfill / Sync profiles table for ALL existing users in auth.users
INSERT INTO public.profiles (id, display_name, first_name, last_name, avatar_url)
SELECT
  id,
  coalesce(
    nullif(raw_user_meta_data->>'display_name', ''),
    nullif(trim(concat(raw_user_meta_data->>'first_name', ' ', raw_user_meta_data->>'last_name')), ''),
    split_part(email, '@', 1)
  ) AS display_name,
  raw_user_meta_data->>'first_name' AS first_name,
  raw_user_meta_data->>'last_name' AS last_name,
  raw_user_meta_data->>'avatar_url' AS avatar_url
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  first_name = coalesce(public.profiles.first_name, EXCLUDED.first_name),
  last_name = coalesce(public.profiles.last_name, EXCLUDED.last_name),
  display_name = coalesce(public.profiles.display_name, EXCLUDED.display_name),
  avatar_url = coalesce(public.profiles.avatar_url, EXCLUDED.avatar_url);
