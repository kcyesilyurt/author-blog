const MEBIBYTE = 1024 * 1024;

export const COVER_IMAGE_MAX_BYTES = 10 * MEBIBYTE;
export const AVATAR_IMAGE_MAX_BYTES = 5 * MEBIBYTE;

export function formatUploadLimit(bytes: number): string {
  return `${Math.floor(bytes / MEBIBYTE)} MB`;
}
