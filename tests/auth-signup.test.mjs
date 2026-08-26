import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const signupUrl = new URL('../src/app/auth/signup/page.tsx', import.meta.url);

test('signup maps Auth error codes and releases its synchronous submit lock', async () => {
  const source = await readFile(signupUrl, 'utf8');

  assert.match(source, /if \(submittingRef\.current\) return/);
  assert.match(source, /submittingRef\.current = true/);
  assert.match(source, /getSignupErrorMessage\(signUpError\)/);
  assert.doesNotMatch(source, /signUpError\.message/);
  assert.match(
    source,
    /finally\s*{[\s\S]*submittingRef\.current = false;[\s\S]*setLoading\(false\)/
  );
});
