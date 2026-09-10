'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthTurnstile, {
  AUTH_CAPTCHA_REQUIRED,
} from '@/components/AuthTurnstile';
import {
  AUTH_RATE_LIMIT_COOLDOWN_SECONDS,
  getLoginErrorMessage,
  isAuthRateLimitError,
} from '@/lib/auth-errors';
import { getSafeInternalPath } from '@/lib/auth-redirect';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const submittingRef = useRef(false);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const callbackError = searchParams.has('error')
    ? 'Doğrulama bağlantısı kullanılamadı. Lütfen yeniden giriş yapın.'
    : null;

  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timeout = window.setTimeout(() => {
      setCooldownSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [cooldownSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current || cooldownSeconds > 0) return;
    if (AUTH_CAPTCHA_REQUIRED && !captchaToken) {
      setCaptchaError('Lütfen güvenlik doğrulamasını tamamlayın.');
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          captchaToken: captchaToken ?? undefined,
        },
      });

      if (signInError) {
        if (isAuthRateLimitError(signInError)) {
          setCooldownSeconds(AUTH_RATE_LIMIT_COOLDOWN_SECONDS);
        }
        setError(getLoginErrorMessage(signInError));
        return;
      }

      router.replace(getSafeInternalPath(searchParams.get('next')));
      router.refresh();
    } catch {
      setError(getLoginErrorMessage(undefined));
    } finally {
      setCaptchaToken(null);
      turnstileRef.current?.reset();
      submittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] items-start justify-center px-4 py-6 lg:items-center lg:py-8">
      <div className="glass-card bg-[#64090C]/10 rounded-2xl p-6 sm:p-8 w-full max-w-sm border border-[#64090C]/30">
        <h1 className="text-2xl font-bold text-[#EFEACD] text-center">Tekrar Hoş Geldiniz</h1>
        <p className="text-[#EFEACD]/60 text-sm text-center mt-1 mb-6">Hesabınıza giriş yapın</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-[#EFEACD]/70">
              E-posta Adresi
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              placeholder="E-posta Adresi"
              autoComplete="email"
              autoCapitalize="none"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-12 w-full rounded-lg border border-[#64090C]/30 bg-[#64090C]/20 px-4 py-3 text-base text-[#EFEACD] focus:border-[#F8D794] focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="mb-2 block text-sm font-medium text-[#EFEACD]/70">
              Şifre
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              placeholder="Şifre"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-12 w-full rounded-lg border border-[#64090C]/30 bg-[#64090C]/20 px-4 py-3 text-base text-[#EFEACD] focus:border-[#F8D794] focus:outline-none"
            />
          </div>

          <AuthTurnstile
            action="login"
            turnstileRef={turnstileRef}
            onTokenChange={setCaptchaToken}
            onErrorChange={setCaptchaError}
          />
          
          {(error || callbackError) && (
            <p role="alert" aria-live="polite" className="text-sm text-red-400">{error || callbackError}</p>
          )}
          {captchaError && (
            <p role="alert" aria-live="polite" className="text-sm text-red-400">{captchaError}</p>
          )}
          
          <button
            type="submit"
            disabled={
              loading ||
              cooldownSeconds > 0 ||
              (AUTH_CAPTCHA_REQUIRED && !captchaToken)
            }
            className="min-h-12 w-full rounded-lg bg-[#9C0512] px-4 py-3 text-base font-medium text-[#EFEACD] transition-colors hover:bg-[#9C0512]/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? 'Giriş yapılıyor...'
              : cooldownSeconds > 0
                ? `Tekrar deneyin (${cooldownSeconds} sn)`
                : 'Giriş Yap'}
          </button>
        </form>
        
        <div className="text-[#EFEACD]/60 text-sm text-center mt-6">
          Hesabınız yok mu?{' '}
          <Link href="/auth/signup" className="text-[#F8D794] hover:underline">
            Kayıt olun
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100dvh-8rem)] items-start justify-center px-4 py-6 text-[#EFEACD]/70 lg:items-center lg:py-8">
          Giriş sayfası yükleniyor...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
