import type { MetadataRoute } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { absoluteSiteUrl } from '@/lib/site';
import type { Book, Chapter } from '@/lib/types';

export const revalidate = 3600;

type SitemapWork = Pick<
  Book,
  'id' | 'slug' | 'cover_url' | 'published_at' | 'created_at' | 'updated_at'
>;
type SitemapChapter = Pick<
  Chapter,
  'book_id' | 'slug' | 'published_at' | 'created_at' | 'updated_at'
>;

function lastModified(item: {
  updated_at: string;
  published_at: string | null;
  created_at: string;
}): string {
  return item.updated_at || item.published_at || item.created_at;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: absoluteSiteUrl('/'),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: absoluteSiteUrl('/pano'),
      changeFrequency: 'daily',
      priority: 0.6,
    },
    {
      url: absoluteSiteUrl('/ben-kimim'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: absoluteSiteUrl('/etkinlikler'),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: absoluteSiteUrl('/iletisim'),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];

  try {
    const admin = createAdminClient();
    const now = new Date().toISOString();
    const { data: workData, error: workError } = await admin
      .from('books')
      .select('id, slug, cover_url, published_at, created_at, updated_at')
      .in('status', ['published', 'scheduled'])
      .lte('published_at', now)
      .order('published_at', { ascending: false });

    if (workError) {
      console.error('Sitemap eserleri alınamadı:', workError.message);
      return entries;
    }

    const works = (workData ?? []) as SitemapWork[];
    const workSlugs = new Map(works.map((work) => [work.id, work.slug]));

    for (const work of works) {
      entries.push({
        url: absoluteSiteUrl(`/books/${work.slug}`),
        lastModified: lastModified(work),
        changeFrequency: 'weekly',
        priority: 0.8,
        images: work.cover_url
          ? [work.cover_url.startsWith('/') ? absoluteSiteUrl(work.cover_url) : work.cover_url]
          : undefined,
      });
    }

    if (works.length === 0) return entries;

    const { data: chapterData, error: chapterError } = await admin
      .from('chapters')
      .select('book_id, slug, published_at, created_at, updated_at')
      .in('book_id', works.map((work) => work.id))
      .in('status', ['published', 'scheduled'])
      .lte('published_at', now)
      .order('published_at', { ascending: false });

    if (chapterError) {
      console.error('Sitemap bölümleri alınamadı:', chapterError.message);
      return entries;
    }

    for (const chapter of (chapterData ?? []) as SitemapChapter[]) {
      const workSlug = workSlugs.get(chapter.book_id);
      if (!workSlug) continue;

      entries.push({
        url: absoluteSiteUrl(`/books/${workSlug}/${chapter.slug}`),
        lastModified: lastModified(chapter),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }

    return entries;
  } catch (error) {
    console.error(
      'Sitemap oluşturulamadı:',
      error instanceof Error ? error.message : 'Bilinmeyen hata'
    );
    return entries;
  }
}
