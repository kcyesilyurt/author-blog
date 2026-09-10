import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const loginUrl = new URL('../src/app/auth/login/page.tsx', import.meta.url);

test('login sends and resets a Turnstile token with a synchronous submit lock', async () => {
  const source = await readFile(loginUrl, 'utf8');

  assert.match(source, /if \(submittingRef\.current \|\| cooldownSeconds > 0\) return/);
  assert.match(source, /captchaToken: captchaToken \?\? undefined/);
  assert.match(source, /AUTH_CAPTCHA_REQUIRED && !captchaToken/);
  assert.match(source, /turnstileRef\.current\?\.reset\(\)/);
  assert.match(source, /getLoginErrorMessage\(signInError\)/);
  assert.match(source, /onErrorChange={setCaptchaError}/);
  assert.match(source, /<AuthTurnstile/);
  assert.match(source, /action="login"/);
});
