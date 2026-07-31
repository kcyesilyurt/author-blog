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
      <div className="bg-zinc-900 rounded-2xl p-8 w-full max-w-sm border border-zinc-800">
        <h1 className="text-2xl font-bold text-zinc-100 text-center">Create account</h1>
        <p className="text-zinc-400 text-sm text-center mt-1 mb-6">Join to comment and react</p>
        
        {success ? (
          <div className="bg-zinc-800 border border-amber-500/50 rounded-lg p-4 text-center">
            <p className="text-zinc-200">Check your email for confirmation!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Display Name"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 focus:border-amber-500 focus:outline-none rounded-lg px-4 py-2.5 w-full text-zinc-200"
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 focus:border-amber-500 focus:outline-none rounded-lg px-4 py-2.5 w-full text-zinc-200"
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 focus:border-amber-500 focus:outline-none rounded-lg px-4 py-2.5 w-full text-zinc-200"
              />
            </div>
            
            {error && <p className="text-red-400 text-sm">{error}</p>}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-medium rounded-lg py-2.5 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </form>
        )}
        
        <div className="text-zinc-400 text-sm text-center mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-amber-500 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
