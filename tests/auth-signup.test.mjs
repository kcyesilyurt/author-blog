import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const signupUrl = new URL('../src/app/auth/signup/page.tsx', import.meta.url);

test('signup maps Auth error codes and releases its synchronous submit lock', async () => {
  const source = await readFile(signupUrl, 'utf8');

  assert.match(
    source,
    /if \(submittingRef\.current \|\| cooldownSeconds > 0\) return/
  );
  assert.match(source, /submittingRef\.current = true/);
  assert.match(source, /getSignupErrorMessage\(signUpError\)/);
  assert.match(source, /captchaToken: captchaToken \?\? undefined/);
  assert.match(source, /AUTH_CAPTCHA_REQUIRED && !captchaToken/);
  assert.match(source, /turnstileRef\.current\?\.reset\(\)/);
  assert.match(source, /setCooldownSeconds\(AUTH_RATE_LIMIT_COOLDOWN_SECONDS\)/);
  assert.doesNotMatch(source, /signUpError\.message/);
  assert.match(
    source,
    /finally\s*{[\s\S]*submittingRef\.current = false;[\s\S]*setLoading\(false\)/
  );
});

test('signup renders the shared Turnstile gate before enabling CAPTCHA upstream', async () => {
  const source = await readFile(signupUrl, 'utf8');

  assert.match(source, /<AuthTurnstile/);
  assert.match(source, /action="signup"/);
  assert.match(source, /onTokenChange={setCaptchaToken}/);
  assert.match(source, /onErrorChange={setCaptchaError}/);
});
