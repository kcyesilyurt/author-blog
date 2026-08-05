export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function sanitizeMarkdownUrl(value: string, image: boolean): string | null {
  const normalized = value.trim().replace(/&amp;/g, '&');
  if (image && normalized.startsWith('/') && !normalized.startsWith('//')) {
    return value.trim();
  }

  try {
    const url = new URL(normalized);
    const allowed = image
      ? ['http:', 'https:'].includes(url.protocol)
      : ['http:', 'https:', 'mailto:'].includes(url.protocol);
    return allowed ? value.trim() : null;
  } catch {
    return null;
  }
}
