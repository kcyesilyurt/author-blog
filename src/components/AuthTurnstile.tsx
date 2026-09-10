'use client';

import type { RefObject } from 'react';
import {
  Turnstile,
  type TurnstileInstance,
} from '@marsidev/react-turnstile';

export const AUTH_CAPTCHA_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? '';
export const AUTH_CAPTCHA_REQUIRED = AUTH_CAPTCHA_SITE_KEY.length > 0;

type AuthTurnstileProps = {
  action: 'login' | 'signup';
  turnstileRef: RefObject<TurnstileInstance | null>;
  onTokenChange: (token: string | null) => void;
  onErrorChange: (message: string | null) => void;
};

export default function AuthTurnstile({
  action,
  turnstileRef,
  onTokenChange,
  onErrorChange,
}: AuthTurnstileProps) {
  if (!AUTH_CAPTCHA_REQUIRED) return null;

  const reportCaptchaError = (message: string) => {
    onTokenChange(null);
    onErrorChange(message);
  };

  return (
    <div className="flex min-h-36 justify-center">
      <Turnstile
        ref={turnstileRef}
        siteKey={AUTH_CAPTCHA_SITE_KEY}
        options={{
          action,
          appearance: 'always',
          language: 'tr',
          size: 'compact',
          theme: 'dark',
        }}
        onSuccess={(token) => {
          onTokenChange(token);
          onErrorChange(null);
        }}
        onExpire={() => {
          reportCaptchaError(
            'Güvenlik doğrulamasının süresi doldu. Lütfen yeniden tamamlayın.'
          );
        }}
        onError={() => {
          reportCaptchaError(
            'Güvenlik doğrulaması yüklenemedi. Bağlantınızı kontrol edip sayfayı yenileyin.'
          );
        }}
        onTimeout={() => {
          reportCaptchaError(
            'Güvenlik doğrulaması zaman aşımına uğradı. Lütfen yeniden deneyin.'
          );
        }}
        onUnsupported={() => {
          reportCaptchaError(
            'Tarayıcınız güvenlik doğrulamasını desteklemiyor. Güncel bir tarayıcıyla yeniden deneyin.'
          );
        }}
        scriptOptions={{
          onError: () => {
            reportCaptchaError(
              'Güvenlik bileşeni indirilemedi. Reklam engelleyicinizi ve bağlantınızı kontrol edip sayfayı yenileyin.'
            );
          },
        }}
      />
    </div>
  );
}
