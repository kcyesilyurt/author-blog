CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  cover_url text,
  type text DEFAULT 'book' CHECK (type IN ('book','post')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  slug text NOT NULL,
  content text DEFAULT '',
  chapter_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(book_id, slug)
);

CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid REFERENCES chapters(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_name text,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT comment_author CHECK (user_id IS NOT NULL OR guest_name IS NOT NULL)
);

CREATE TABLE reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid REFERENCES chapters(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_identifier text,
  type text NOT NULL CHECK (type IN ('like','heart','bookmark')),
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX reactions_user_unique ON reactions(chapter_id, user_id, type) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX reactions_guest_unique ON reactions(chapter_id, guest_identifier, type) WHERE guest_identifier IS NOT NULL;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "books_select_policy" ON books FOR SELECT USING (true);
CREATE POLICY "chapters_select_policy" ON chapters FOR SELECT USING (true);

CREATE POLICY "profiles_select_policy" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_policy" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_policy" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "comments_select_policy" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_auth_policy" ON comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "comments_insert_anon_policy" ON comments FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "reactions_select_policy" ON reactions FOR SELECT USING (true);
CREATE POLICY "reactions_insert_auth_policy" ON reactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "reactions_insert_anon_policy" ON reactions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "reactions_delete_auth_policy" ON reactions FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "reactions_delete_anon_policy" ON reactions FOR DELETE TO anon USING (guest_identifier IS NOT NULL);

-- Trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Indexes
CREATE INDEX idx_chapters_book_order ON chapters(book_id, chapter_order);
CREATE INDEX idx_comments_chapter ON comments(chapter_id, created_at);
CREATE INDEX idx_reactions_chapter_type ON reactions(chapter_id, type);
