export const PUBLICATIONS_CACHE_TAG = 'publications';
export const PUBLICATIONS_REVALIDATE_SECONDS = 60;

export const PUBLIC_BOOK_FIELDS =
  'id, title, slug, description, cover_url, type, status, published_at, created_at, updated_at';

export const PUBLIC_CHAPTER_LIST_FIELDS =
  'id, book_id, title, slug, chapter_order';

export const PUBLIC_CHAPTER_FIELDS =
  'id, book_id, title, slug, content, chapter_order';

export const PUBLIC_CHAPTER_ROUTE_FIELDS = 'book_id, slug';
