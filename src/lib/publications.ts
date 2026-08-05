import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import {
  PUBLIC_BOOK_FIELDS,
  PUBLIC_CHAPTER_FIELDS,
  PUBLIC_CHAPTER_LIST_FIELDS,
  PUBLIC_CHAPTER_ROUTE_FIELDS,
  PUBLICATIONS_CACHE_TAG,
  PUBLICATIONS_REVALIDATE_SECONDS,
} from '@/lib/publication-cache';
import type {
  Book,
  PublicChapter,
  PublicChapterListItem,
  PublicChapterRouteItem,
} from '@/lib/types';

let publicClient: SupabaseClient | null = null;

function getPublicClient() {
  if (publicClient) return publicClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error('Supabase herkese açık ortam değişkenleri eksik');
  }

  publicClient = createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

  return publicClient;
}

const cacheScope = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'missing-supabase-url';

const getPublicWorksCached = unstable_cache(
  async (): Promise<Book[]> => {
    const query = getPublicClient()
      .from('books')
      .select(PUBLIC_BOOK_FIELDS)
      .in('status', ['published', 'scheduled'])
      .lte('published_at', new Date().toISOString());
    const { data, error } = await query
      .order('created_at', { ascending: false });

    if (error) throw new Error('Yayınlanmış eserler yüklenemedi');
    return (data ?? []) as Book[];
  },
  ['public-works-v1', cacheScope, PUBLIC_BOOK_FIELDS],
  {
    revalidate: PUBLICATIONS_REVALIDATE_SECONDS,
    tags: [PUBLICATIONS_CACHE_TAG],
  }
);

const getPublicBookCached = unstable_cache(
  async (slug: string): Promise<Book | null> => {
    const query = getPublicClient()
      .from('books')
      .select(PUBLIC_BOOK_FIELDS)
      .eq('slug', slug)
      .in('status', ['published', 'scheduled'])
      .lte('published_at', new Date().toISOString());
    const { data, error } = await query.maybeSingle();

    if (error) throw new Error('Eser yüklenemedi');
    return data as Book | null;
  },
  ['public-book-v1', cacheScope, PUBLIC_BOOK_FIELDS],
  {
    revalidate: PUBLICATIONS_REVALIDATE_SECONDS,
    tags: [PUBLICATIONS_CACHE_TAG],
  }
);

const getPublicChapterListCached = unstable_cache(
  async (bookId: string): Promise<PublicChapterListItem[]> => {
    const query = getPublicClient()
      .from('chapters')
      .select(PUBLIC_CHAPTER_LIST_FIELDS)
      .eq('book_id', bookId)
      .in('status', ['published', 'scheduled'])
      .lte('published_at', new Date().toISOString());
    const { data, error } = await query
      .order('chapter_order', { ascending: true });

    if (error) throw new Error('Bölüm listesi yüklenemedi');
    return (data ?? []) as PublicChapterListItem[];
  },
  ['public-chapter-list-v1', cacheScope, PUBLIC_CHAPTER_LIST_FIELDS],
  {
    revalidate: PUBLICATIONS_REVALIDATE_SECONDS,
    tags: [PUBLICATIONS_CACHE_TAG],
  }
);

const getPublicChapterCached = unstable_cache(
  async (bookId: string, chapterSlug: string): Promise<PublicChapter | null> => {
    const query = getPublicClient()
      .from('chapters')
      .select(PUBLIC_CHAPTER_FIELDS)
      .eq('book_id', bookId)
      .eq('slug', chapterSlug)
      .in('status', ['published', 'scheduled'])
      .lte('published_at', new Date().toISOString());
    const { data, error } = await query.maybeSingle();

    if (error) throw new Error('Bölüm yüklenemedi');
    return data as PublicChapter | null;
  },
  ['public-chapter-v1', cacheScope, PUBLIC_CHAPTER_FIELDS],
  {
    revalidate: PUBLICATIONS_REVALIDATE_SECONDS,
    tags: [PUBLICATIONS_CACHE_TAG],
  }
);

const getPublicChapterRoutesCached = unstable_cache(
  async (): Promise<PublicChapterRouteItem[]> => {
    const { data, error } = await getPublicClient()
      .from('chapters')
      .select(PUBLIC_CHAPTER_ROUTE_FIELDS)
      .in('status', ['published', 'scheduled'])
      .lte('published_at', new Date().toISOString());

    if (error) throw new Error('Bölüm adresleri yüklenemedi');
    return (data ?? []) as PublicChapterRouteItem[];
  },
  ['public-chapter-routes-v1', cacheScope, PUBLIC_CHAPTER_ROUTE_FIELDS],
  {
    revalidate: PUBLICATIONS_REVALIDATE_SECONDS,
    tags: [PUBLICATIONS_CACHE_TAG],
  }
);

// React cache aynı sayfa üretimi sırasında metadata ve sayfanın aynı sorguyu
// iki kez çalıştırmasını önler. unstable_cache ise sonucu istekler arasında paylaşır.
export const getPublicWorks = cache(getPublicWorksCached);
export const getPublicBook = cache(getPublicBookCached);
export const getPublicChapterList = cache(getPublicChapterListCached);
export const getPublicChapter = cache(getPublicChapterCached);
export const getPublicChapterRoutes = cache(getPublicChapterRoutesCached);
