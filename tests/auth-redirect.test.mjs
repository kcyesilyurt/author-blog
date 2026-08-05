import test from 'node:test';
import assert from 'node:assert/strict';
import { getSafeInternalPath } from '../src/lib/auth-redirect.ts';

test('auth redirect keeps valid internal paths, queries and fragments', () => {
  assert.equal(getSafeInternalPath('/admin'), '/admin');
  assert.equal(getSafeInternalPath('/admin/kitaplar?durum=taslak#liste'), '/admin/kitaplar?durum=taslak#liste');
});

test('auth redirect rejects external and ambiguous destinations', () => {
  const unsafeDestinations = [
    null,
    '',
    '@evil.example',
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    '/%2fevil.example',
    '/%5cevil.example',
    '/admin\nLocation: https://evil.example',
  ];

  for (const destination of unsafeDestinations) {
    assert.equal(getSafeInternalPath(destination), '/');
  }
});
