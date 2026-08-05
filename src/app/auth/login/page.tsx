'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSafeInternalPath } from '@/lib/auth-redirect';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const callbackError = searchParams.has('error')
    ? 'Doğrulama bağlantısı kullanılamadı. Lütfen yeniden giriş yapın.'
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError('Giriş başarısız. E-posta veya şifre hatalı.');
      setLoading(false);
    } else {
      router.replace(getSafeInternalPath(searchParams.get('next')));
      router.refresh();
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <div className="glass-card bg-[#64090C]/10 rounded-2xl p-6 sm:p-8 w-full max-w-sm border border-[#64090C]/30">
        <h1 className="text-2xl font-bold text-[#EFEACD] text-center">Tekrar Hoş Geldiniz</h1>
        <p className="text-[#EFEACD]/60 text-sm text-center mt-1 mb-6">Hesabınıza giriş yapın</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="E-posta Adresi"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#64090C]/20 border border-[#64090C]/30 focus:border-[#F8D794] focus:outline-none rounded-lg px-4 py-2.5 w-full text-[#EFEACD]"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Şifre"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#64090C]/20 border border-[#64090C]/30 focus:border-[#F8D794] focus:outline-none rounded-lg px-4 py-2.5 w-full text-[#EFEACD]"
            />
          </div>
          
          {(error || callbackError) && (
            <p className="text-red-400 text-sm">{error || callbackError}</p>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#9C0512] hover:bg-[#9C0512]/80 text-[#EFEACD] font-medium rounded-lg py-2.5 transition-colors disabled:opacity-50"
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
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
        <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 text-[#EFEACD]/70">
          Giriş sayfası yükleniyor...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
