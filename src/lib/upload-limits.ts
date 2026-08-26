const MEBIBYTE = 1024 * 1024;

export const COVER_IMAGE_MAX_BYTES = 10 * MEBIBYTE;
export const AVATAR_IMAGE_MAX_BYTES = 5 * MEBIBYTE;
export const FAN_ART_IMAGE_MAX_BYTES = 6 * MEBIBYTE;
export const FAN_ART_DERIVATIVE_MAX_BYTES = 6 * MEBIBYTE;
export const FAN_ART_MAX_INPUT_PIXELS = 25_000_000;
export const FAN_ART_MAX_DIMENSION = 2400;

export function formatUploadLimit(bytes: number): string {
  return `${Math.floor(bytes / MEBIBYTE)} MB`;
}
