'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
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
        data: {
          display_name: displayName,
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
      <div className="glass-card bg-neutral-900/50 rounded-2xl p-6 sm:p-8 w-full max-w-sm border border-neutral-800">
        <h1 className="text-2xl font-bold text-white text-center">Hesap Oluştur</h1>
        <p className="text-neutral-400 text-sm text-center mt-1 mb-6">Yorum yapmak ve takip etmek için katılın</p>
        
        {success ? (
          <div className="bg-neutral-800 border border-pink-400/50 rounded-lg p-4 text-center">
            <p className="text-neutral-200">Doğrulama bağlantısı için e-postanızı kontrol edin!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Görünen İsim"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-neutral-800 border border-neutral-700 focus:border-pink-400 focus:outline-none rounded-lg px-4 py-2.5 w-full text-neutral-200"
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="E-posta Adresi"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-neutral-800 border border-neutral-700 focus:border-pink-400 focus:outline-none rounded-lg px-4 py-2.5 w-full text-neutral-200"
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
                className="bg-neutral-800 border border-neutral-700 focus:border-pink-400 focus:outline-none rounded-lg px-4 py-2.5 w-full text-neutral-200"
              />
            </div>
            
            {error && <p className="text-red-400 text-sm">{error}</p>}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-pink-400 hover:bg-pink-300 text-black font-medium rounded-lg py-2.5 transition-colors disabled:opacity-50"
            >
              {loading ? 'Kayıt olunuyor...' : 'Kayıt Ol'}
            </button>
          </form>
        )}
        
        <div className="text-neutral-400 text-sm text-center mt-6">
          Zaten hesabınız var mı?{' '}
          <Link href="/auth/login" className="text-pink-400 hover:underline">
            Giriş yapın
          </Link>
        </div>
      </div>
    </div>
  );
}
