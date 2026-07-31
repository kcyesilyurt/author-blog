'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      setError(signInError.message);
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <div className="glass-card bg-neutral-900 rounded-2xl p-8 w-full max-w-sm border border-neutral-800">
        <h1 className="text-2xl font-bold text-white text-center">Welcome back</h1>
        <p className="text-neutral-400 text-sm text-center mt-1 mb-6">Sign in to your account</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-neutral-800 border border-neutral-700 focus:border-pink-400 focus:outline-none rounded-lg px-4 py-2.5 w-full text-neutral-200"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              required
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
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        
        <div className="text-neutral-400 text-sm text-center mt-6">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="text-pink-400 hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
