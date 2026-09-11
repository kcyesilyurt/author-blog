export interface Profile {
  id: string;
  display_name: string;
  username: string | null;
  first_name?: string;
  last_name?: string;
  avatar_url: string | null;
  is_banned: boolean;
  is_admin?: boolean;
  created_at: string;
}

export interface Book {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_url: string | null;
  type: 'book' | 'post';
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  published_at: string | null;
  created_at: string;
  updated_at: string;
  view_count: number;
}

export interface Chapter {
  id: string;
  book_id: string;
  title: string;
  slug: string;
  content: string;
  chapter_order: number;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  published_at: string | null;
  created_at: string;
  updated_at: string;
  view_count: number;
}

export type PublicChapterListItem = Pick<
  Chapter,
  'id' | 'book_id' | 'title' | 'slug' | 'chapter_order' | 'view_count'
>;

export type PublicChapter = Pick<
  Chapter,
  'id' | 'book_id' | 'title' | 'slug' | 'content' | 'chapter_order' | 'view_count'
>;

export type PublicChapterRouteItem = Pick<Chapter, 'book_id' | 'slug'>;

export interface CommunityProfile {
  username: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
}

export interface CommunityCursor {
  createdAt: string;
  id: string;
}

export interface CommunityPage<T> {
  items: T[];
  nextCursor: CommunityCursor | null;
}

export interface Comment {
  id: string;
  chapter_id: string;
  user_id: string | null;
  guest_name: string | null;
  content: string;
  created_at: string;
  profiles: CommunityProfile | null;
}

export interface PanoMessage {
  id: string;
  user_id: string | null;
  guest_name: string | null;
  content: string;
  created_at: string;
  profiles: CommunityProfile | null;
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

export interface Event {
  id: string;
  slug: string;
  title: string;
  location: string;
  event_date: string;
  event_time: string | null;
  description: string | null;
  external_url: string | null;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface ContactMessage {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  read_at: string | null;
}

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type FanArtStatus =
  | 'uploading'
  | 'processing'
  | 'cancelled'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'removed';

export type FanArtOwnStatus = 'pending' | 'approved' | 'rejected' | 'removed';

export interface FanArtCursor {
  moderatedAt: string;
  id: number;
}

export interface FanArtOwnCursor {
  activityAt: string;
  id: number;
}

export interface FanArtPublicItem {
  id: number;
  title: string;
  caption: string | null;
  altText: string;
  imageUrl: string;
  width: number;
  height: number;
  createdAt: string;
  artistName: string;
}

export interface FanArtPublicPage {
  items: FanArtPublicItem[];
  nextCursor: FanArtCursor | null;
}

export interface FanArtOwnItem {
  id: number;
  title: string;
  status: FanArtOwnStatus;
  createdAt: string;
  moderationReason: string | null;
}

export interface FanArtOwnPage {
  items: FanArtOwnItem[];
  nextCursor: FanArtOwnCursor | null;
}

export interface AdminFanArtItem {
  id: number;
  title: string;
  caption: string | null;
  altText: string;
  previewUrl: string;
  width: number;
  height: number;
  submittedAt: string;
  artistName: string;
}

export interface AdminPublishedFanArtItem {
  id: number;
  title: string;
  altText: string;
  imageUrl: string;
  width: number;
  height: number;
  publishedAt: string;
  artistName: string;
}

export interface AdminPublishedFanArtPage {
  items: AdminPublishedFanArtItem[];
  nextCursor: FanArtCursor | null;
}
