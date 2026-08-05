import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getImageMimeFromObjectPath,
  getOwnedPublicObjectPath,
  validateImageFile,
  validateStoredImage,
} from '../src/lib/image-upload.ts';

test('image validator accepts matching PNG signatures', async () => {
  const png = new File(
    [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0])],
    'avatar.png',
    { type: 'image/png' }
  );
  const result = await validateImageFile(png, 1024);
  assert.equal(result.mime, 'image/png');
  assert.equal(result.extension, 'png');
});

test('image validator rejects MIME spoofing, SVG and oversized files', async () => {
  const spoofed = new File(['not really a png'], 'fake.png', { type: 'image/png' });
  const svg = new File(['<svg></svg>'], 'avatar.svg', { type: 'image/svg+xml' });
  const oversized = new File([new Uint8Array(20)], 'large.jpg', { type: 'image/jpeg' });

  await assert.rejects(() => validateImageFile(spoofed, 1024));
  await assert.rejects(() => validateImageFile(svg, 1024));
  await assert.rejects(() => validateImageFile(oversized, 10));
});

test('old avatar cleanup only accepts an object owned by the same user', () => {
  const userId = '11111111-1111-1111-1111-111111111111';
  const ownedUrl = `https://project.supabase.co/storage/v1/object/public/avatars/${userId}/avatar.png`;
  const foreignUrl = 'https://project.supabase.co/storage/v1/object/public/avatars/other/avatar.png';

  assert.equal(
    getOwnedPublicObjectPath(ownedUrl, 'avatars', userId),
    `${userId}/avatar.png`
  );
  assert.equal(getOwnedPublicObjectPath(foreignUrl, 'avatars', userId), null);
});

test('signed-upload object paths are strict and imply the expected MIME type', () => {
  const userId = '11111111-1111-4111-8111-111111111111';
  const fileName = '22222222-2222-4222-8222-222222222222.webp';

  assert.equal(getImageMimeFromObjectPath(fileName), 'image/webp');
  assert.equal(getImageMimeFromObjectPath(`${userId}/${fileName}`, userId), 'image/webp');
  assert.equal(getImageMimeFromObjectPath(`other/${fileName}`, userId), null);
  assert.equal(getImageMimeFromObjectPath(`${userId}/nested/${fileName}`, userId), null);
  assert.equal(getImageMimeFromObjectPath('../cover.png'), null);
});

test('stored image validation checks magic bytes after direct upload', async () => {
  const validPng = new Blob(
    [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0])],
    { type: 'image/png' }
  );
  const invalidPng = new Blob(['not a png'], { type: 'image/png' });

  await assert.doesNotReject(() => validateStoredImage(validPng, 'image/png', 1024));
  await assert.rejects(() => validateStoredImage(invalidPng, 'image/png', 1024));
});
