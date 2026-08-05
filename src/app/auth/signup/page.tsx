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
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <div className="glass-card bg-[#64090C]/10 rounded-2xl p-6 sm:p-8 w-full max-w-sm border border-[#64090C]/30">
        <h1 className="text-2xl font-bold text-[#EFEACD] text-center">Hesap Oluştur</h1>
        <p className="text-[#EFEACD]/60 text-sm text-center mt-1 mb-6">Yorum yapmak ve takip etmek için katılın</p>
        
        {success ? (
          <div className="bg-[#64090C]/20 border border-[#F8D794]/30 rounded-lg p-4 text-center">
            <p className="text-[#EFEACD]">Doğrulama bağlantısı için e-postanızı kontrol edin!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Ad"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="bg-[#64090C]/20 border border-[#64090C]/30 focus:border-[#F8D794] focus:outline-none rounded-lg px-4 py-2.5 w-full text-[#EFEACD]"
              />
              <input
                type="text"
                placeholder="Soyad"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="bg-[#64090C]/20 border border-[#64090C]/30 focus:border-[#F8D794] focus:outline-none rounded-lg px-4 py-2.5 w-full text-[#EFEACD]"
              />
            </div>
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
                placeholder="Şifre (en az 6 karakter)"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#64090C]/20 border border-[#64090C]/30 focus:border-[#F8D794] focus:outline-none rounded-lg px-4 py-2.5 w-full text-[#EFEACD]"
              />
            </div>
            
            {error && <p className="text-red-400 text-sm">{error}</p>}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#9C0512] hover:bg-[#9C0512]/80 text-[#EFEACD] font-medium rounded-lg py-2.5 transition-colors disabled:opacity-50"
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
