import { randomUUID } from 'node:crypto';

const IMAGE_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

const IMAGE_MIME_BY_EXTENSION = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
} as const;

const UUID_FILENAME_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$/i;

export type AllowedImageMime = keyof typeof IMAGE_TYPES;

export function validateImageMetadata(
  mimeValue: unknown,
  sizeValue: unknown,
  maximumBytes: number
): { mime: AllowedImageMime; extension: string } {
  if (
    typeof sizeValue !== 'number' ||
    !Number.isInteger(sizeValue) ||
    sizeValue <= 0
  ) {
    throw new Error('Geçerli bir görsel seçin');
  }

  if (sizeValue > maximumBytes) {
    throw new Error(`Görsel boyutu en fazla ${Math.floor(maximumBytes / 1024 / 1024)} MB olabilir`);
  }

  if (typeof mimeValue !== 'string' || !(mimeValue in IMAGE_TYPES)) {
    throw new Error('Yalnızca JPEG, PNG veya WebP görseller yüklenebilir');
  }

  const mime = mimeValue as AllowedImageMime;
  return { mime, extension: IMAGE_TYPES[mime] };
}

function hasImageSignature(bytes: Uint8Array, mime: AllowedImageMime): boolean {
  if (mime === 'image/jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (mime === 'image/png') {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return signature.every((value, index) => bytes[index] === value);
  }

  return (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  );
}

export async function validateImageFile(
  value: FormDataEntryValue | null,
  maximumBytes: number
): Promise<{ file: File; mime: AllowedImageMime; extension: string }> {
  if (!(value instanceof File) || value.size <= 0) {
    throw new Error('Geçerli bir görsel seçin');
  }

  const { mime, extension } = validateImageMetadata(value.type, value.size, maximumBytes);
  const header = new Uint8Array(await value.slice(0, 16).arrayBuffer());
  if (!hasImageSignature(header, mime)) {
    throw new Error('Dosyanın içeriği seçilen görsel türüyle eşleşmiyor');
  }

  return { file: value, mime, extension };
}

export async function validateStoredImage(
  value: Blob,
  expectedMime: AllowedImageMime,
  maximumBytes: number
): Promise<void> {
  validateImageMetadata(expectedMime, value.size, maximumBytes);
  const header = new Uint8Array(await value.slice(0, 16).arrayBuffer());
  if (!hasImageSignature(header, expectedMime)) {
    throw new Error('Yüklenen dosya geçerli bir görsel değil');
  }
}

export function createImageObjectName(extension: string): string {
  return `${randomUUID()}.${extension}`;
}

export function getImageMimeFromObjectPath(
  value: unknown,
  ownerId?: string
): AllowedImageMime | null {
  if (typeof value !== 'string') return null;
  const expectedPrefix = ownerId ? `${ownerId}/` : '';
  if (!value.startsWith(expectedPrefix)) return null;

  const filename = value.slice(expectedPrefix.length);
  const match = filename.match(UUID_FILENAME_PATTERN);
  if (!match) return null;

  return IMAGE_MIME_BY_EXTENSION[match[1].toLowerCase() as keyof typeof IMAGE_MIME_BY_EXTENSION];
}

export function getOwnedPublicObjectPath(
  publicUrl: string | null | undefined,
  bucket: string,
  ownerId: string
): string | null {
  if (!publicUrl) return null;

  try {
    const url = new URL(publicUrl);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex === -1) return null;

    const objectPath = decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
    return objectPath.startsWith(`${ownerId}/`) ? objectPath : null;
  } catch {
    return null;
  }
}
