-- Fix comments table foreign key to reference profiles instead of auth.users
-- This allows PostgREST to properly join profiles when querying comments

ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;
ALTER TABLE comments ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Also fix reactions if they need to join profiles
ALTER TABLE reactions DROP CONSTRAINT IF EXISTS reactions_user_id_fkey;
ALTER TABLE reactions ADD CONSTRAINT reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Ensure RLS policies on comments allow users with stale sessions to insert as anon if they have no user_id
DROP POLICY IF EXISTS "comments_insert_auth_policy" ON comments;
CREATE POLICY "comments_insert_auth_policy" ON comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
