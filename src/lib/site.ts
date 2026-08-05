import 'server-only';

import type { Metadata } from 'next';

const FALLBACK_SITE_URL = 'https://ovgudevecisafi.com';

function resolveSiteUrl(value: string | undefined): URL {
  try {
    const url = new URL(value?.trim() || FALLBACK_SITE_URL);

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return new URL(FALLBACK_SITE_URL);
    }

    url.pathname = '/';
    url.search = '';
    url.hash = '';
    return url;
  } catch {
    return new URL(FALLBACK_SITE_URL);
  }
}

export const SITE_URL = resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME?.trim() || 'Övgü Deveci Safi';
export const SITE_DESCRIPTION =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION?.trim() || 'Hikâyeler ve Düşünceler';
export const SOCIAL_IMAGE_PATH = '/images/author/hero-forest.jpg';

export const PRIVATE_ROBOTS = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
  },
} satisfies NonNullable<Metadata['robots']>;

export function absoluteSiteUrl(path = '/'): string {
  return new URL(path, SITE_URL).toString();
}
