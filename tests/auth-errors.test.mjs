import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AUTH_RATE_LIMIT_COOLDOWN_SECONDS,
  getLoginErrorMessage,
  getSignupErrorMessage,
  isAuthRateLimitError,
} from '../src/lib/auth-errors.ts';

test('signup rate-limit errors are translated by stable Auth error code', () => {
  assert.equal(
    getSignupErrorMessage({ code: 'over_email_send_rate_limit', status: 429 }),
    'Doğrulama e-postası gönderme sınırına ulaşıldı. Lütfen biraz sonra tekrar deneyin.'
  );
  assert.equal(
    getSignupErrorMessage({ code: 'over_request_rate_limit', status: 429 }),
    'Çok fazla kayıt isteği gönderildi. Lütfen biraz bekleyip tekrar deneyin.'
  );
  assert.equal(
    getSignupErrorMessage({ status: 429 }),
    'Çok fazla istek gönderildi. Lütfen biraz bekleyip tekrar deneyin.'
  );
});

test('auth rate-limit detection drives a bounded client cooldown', () => {
  assert.equal(AUTH_RATE_LIMIT_COOLDOWN_SECONDS, 60);
  assert.equal(
    isAuthRateLimitError({ code: 'over_email_send_rate_limit', status: 429 }),
    true
  );
  assert.equal(isAuthRateLimitError({ code: 'over_request_rate_limit' }), true);
  assert.equal(isAuthRateLimitError({ status: 429 }), true);
  assert.equal(isAuthRateLimitError({ code: 'captcha_failed', status: 400 }), false);
});

test('login maps CAPTCHA and request throttling without leaking provider details', () => {
  assert.equal(
    getLoginErrorMessage({ code: 'captcha_failed', status: 400 }),
    'Güvenlik doğrulaması tamamlanamadı. Lütfen yeniden deneyin.'
  );
  assert.equal(
    getLoginErrorMessage({ code: 'over_request_rate_limit', status: 429 }),
    'Çok fazla giriş isteği gönderildi. Lütfen biraz bekleyip tekrar deneyin.'
  );
  assert.equal(
    getLoginErrorMessage({ code: 'unexpected_failure', status: 500 }),
    'Giriş başarısız. E-posta veya şifre hatalı.'
  );
});

test('signup errors never expose an unknown provider message', () => {
  const providerMessage = 'Internal provider detail that must stay private';
  const translated = getSignupErrorMessage({
    code: 'unexpected_failure',
    status: 500,
    message: providerMessage,
  });

  assert.equal(
    translated,
    'Kayıt şu anda tamamlanamadı. Lütfen daha sonra tekrar deneyin.'
  );
  assert.doesNotMatch(translated, new RegExp(providerMessage));
  assert.equal(
    getSignupErrorMessage(undefined),
    'Kayıt şu anda tamamlanamadı. Lütfen daha sonra tekrar deneyin.'
  );
});
