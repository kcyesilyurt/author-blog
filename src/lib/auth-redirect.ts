const INTERNAL_URL_BASE = 'https://internal.invalid';
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;
const ENCODED_LEADING_SEPARATOR = /^\/(?:%2f|%5c)/i;

export function getSafeInternalPath(value: string | null | undefined): string {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    CONTROL_CHARACTERS.test(value) ||
    ENCODED_LEADING_SEPARATOR.test(value)
  ) {
    return '/';
  }

  try {
    const url = new URL(value, INTERNAL_URL_BASE);

    if (url.origin !== INTERNAL_URL_BASE) return '/';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/';
  }
}
