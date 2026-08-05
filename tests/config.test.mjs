import test from 'node:test';
import assert from 'node:assert/strict';
import nextConfig from '../next.config.ts';

test('large files bypass Server Actions and the legacy books link is preserved', async () => {
  assert.equal(nextConfig.experimental?.serverActions, undefined);
  assert.equal(nextConfig.experimental?.proxyClientMaxBodySize, undefined);

  const redirects = await nextConfig.redirects?.();
  assert.deepEqual(redirects, [
    {
      source: '/kitaplarim',
      destination: '/#kitaplarim',
      permanent: true,
    },
  ]);
});
