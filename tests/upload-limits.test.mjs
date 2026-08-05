import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AVATAR_IMAGE_MAX_BYTES,
  COVER_IMAGE_MAX_BYTES,
  formatUploadLimit,
} from '../src/lib/upload-limits.ts';

test('configured image limits are larger than the old 1 MB request default', () => {
  assert.equal(formatUploadLimit(AVATAR_IMAGE_MAX_BYTES), '5 MB');
  assert.equal(formatUploadLimit(COVER_IMAGE_MAX_BYTES), '10 MB');
  assert.ok(AVATAR_IMAGE_MAX_BYTES > 1024 * 1024);
  assert.ok(COVER_IMAGE_MAX_BYTES > AVATAR_IMAGE_MAX_BYTES);
});
