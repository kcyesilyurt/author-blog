-- 1. Add is_admin column to profiles if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- The first admin is bootstrapped from the server-only ADMIN_USER_ID variable.
-- Do not grant this role by a public or user-controlled email address.

-- 2. Ensure foreign key constraint between pano_messages and profiles
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pano_messages') THEN
    ALTER TABLE pano_messages DROP CONSTRAINT IF EXISTS pano_messages_user_id_fkey;
    ALTER TABLE pano_messages ADD CONSTRAINT pano_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;
