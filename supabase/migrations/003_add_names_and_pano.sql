-- 1. Add first_name and last_name to profiles if not exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name text;

-- 2. Create pano_messages table (referencing profiles directly for PostgREST join)
CREATE TABLE IF NOT EXISTS pano_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  guest_name text,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE pano_messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DROP POLICY IF EXISTS "pano_select_policy" ON pano_messages;
DROP POLICY IF EXISTS "pano_insert_auth_policy" ON pano_messages;
DROP POLICY IF EXISTS "pano_insert_anon_policy" ON pano_messages;
DROP POLICY IF EXISTS "pano_delete_auth_policy" ON pano_messages;

CREATE POLICY "pano_select_policy" ON pano_messages FOR SELECT USING (true);
CREATE POLICY "pano_insert_auth_policy" ON pano_messages FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "pano_insert_anon_policy" ON pano_messages FOR INSERT TO anon WITH CHECK (guest_name IS NOT NULL);
CREATE POLICY "pano_delete_auth_policy" ON pano_messages FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 5. Update handle_new_user trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, first_name, last_name)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
