import test from 'node:test';
import assert from 'node:assert/strict';
import { getSignupErrorMessage } from '../src/lib/auth-errors.ts';

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
