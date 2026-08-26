import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const turnstileUrl = new URL(
  '../src/components/AuthTurnstile.tsx',
  import.meta.url
);

test('Turnstile reports script, browser and challenge failures without erasing Auth errors', async () => {
  const source = await readFile(turnstileUrl, 'utf8');

  assert.match(source, /scriptOptions={{[\s\S]*onError:/);
  assert.match(source, /onUnsupported=/);
  assert.match(source, /onTimeout=/);
  assert.match(source, /onErrorChange\(null\)/);
});
