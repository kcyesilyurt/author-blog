'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: new URL('/auth/callback', window.location.origin).toString(),
        data: {
          first_name: firstName,
          last_name: lastName,
          display_name: `${firstName} ${lastName}`.trim(),
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] items-start justify-center px-4 py-6 lg:items-center lg:py-8">
      <div className="glass-card bg-[#64090C]/10 rounded-2xl p-6 sm:p-8 w-full max-w-sm border border-[#64090C]/30">
        <h1 className="text-2xl font-bold text-[#EFEACD] text-center">Hesap Oluştur</h1>
        <p className="text-[#EFEACD]/60 text-sm text-center mt-1 mb-6">Yorum yapmak ve takip etmek için katılın</p>
        
        {success ? (
          <div className="bg-[#64090C]/20 border border-[#F8D794]/30 rounded-lg p-4 text-center">
            <p className="text-[#EFEACD]">Doğrulama bağlantısı için e-postanızı kontrol edin!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="signup-first-name" className="mb-2 block text-sm font-medium text-[#EFEACD]/70">
                  Ad
                </label>
                <input
                  id="signup-first-name"
                  name="firstName"
                  type="text"
                  placeholder="Ad"
                  autoComplete="given-name"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="min-h-12 w-full rounded-lg border border-[#64090C]/30 bg-[#64090C]/20 px-4 py-3 text-base text-[#EFEACD] focus:border-[#F8D794] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="signup-last-name" className="mb-2 block text-sm font-medium text-[#EFEACD]/70">
                  Soyad
                </label>
                <input
                  id="signup-last-name"
                  name="lastName"
                  type="text"
                  placeholder="Soyad"
                  autoComplete="family-name"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="min-h-12 w-full rounded-lg border border-[#64090C]/30 bg-[#64090C]/20 px-4 py-3 text-base text-[#EFEACD] focus:border-[#F8D794] focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label htmlFor="signup-email" className="mb-2 block text-sm font-medium text-[#EFEACD]/70">
                E-posta Adresi
              </label>
              <input
                id="signup-email"
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
              <label htmlFor="signup-password" className="mb-2 block text-sm font-medium text-[#EFEACD]/70">
                Şifre
              </label>
              <input
                id="signup-password"
                name="password"
                type="password"
                placeholder="Şifre (en az 6 karakter)"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="min-h-12 w-full rounded-lg border border-[#64090C]/30 bg-[#64090C]/20 px-4 py-3 text-base text-[#EFEACD] focus:border-[#F8D794] focus:outline-none"
              />
            </div>
            
            {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
            
            <button
              type="submit"
              disabled={loading}
              className="min-h-12 w-full rounded-lg bg-[#9C0512] px-4 py-3 text-base font-medium text-[#EFEACD] transition-colors hover:bg-[#9C0512]/80 disabled:opacity-50"
            >
              {loading ? 'Kayıt olunuyor...' : 'Kayıt Ol'}
            </button>
          </form>
        )}
        
        <div className="text-[#EFEACD]/60 text-sm text-center mt-6">
          Zaten hesabınız var mı?{' '}
          <Link href="/auth/login" className="text-[#F8D794] hover:underline">
            Giriş yapın
          </Link>
        </div>
      </div>
    </div>
  );
}
