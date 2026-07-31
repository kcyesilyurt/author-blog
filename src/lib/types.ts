export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  instagram_username: string | null;
  created_at: string;
}

export interface Book {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_url: string | null;
  type: 'book' | 'post';
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  book_id: string;
  title: string;
  slug: string;
  content: string;
  chapter_order: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  chapter_id: string;
  user_id: string | null;
  guest_name: string | null;
  content: string;
  created_at: string;
  profiles?: {
    display_name: string;
    avatar_url: string | null;
    instagram_username: string | null;
  } | null;
}

export interface Reaction {
  id: string;
  chapter_id: string;
  user_id: string | null;
  guest_identifier: string | null;
  type: 'like' | 'heart' | 'bookmark';
  created_at: string;
}

export interface ReactionCount {
  type: 'like' | 'heart' | 'bookmark';
  count: number;
}
