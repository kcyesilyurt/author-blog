'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { updateProfile } from './actions';
import type { User } from '@supabase/supabase-js';

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [instagram, setInstagram] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }
      setUser(user);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, instagram_username')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setDisplayName(profile.display_name || '');
        setInstagram(profile.instagram_username || '');
      }
      setLoading(false);
    };
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const formData = new FormData();
      formData.append('display_name', displayName);
      formData.append('instagram_username', instagram);
      await updateProfile(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <div className="glass-card rounded-2xl p-6 sm:p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-white text-center">Profile Settings</h1>
        <p className="text-neutral-400 text-sm text-center mt-1 mb-8">{user?.email}</p>
        
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1.5">Display Name</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-neutral-800 border border-neutral-700 focus:border-pink-400 focus:outline-none rounded-lg px-4 py-3 w-full text-neutral-200 text-base"
            />
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-pink-400" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
              <label className="text-sm font-medium text-neutral-400">Instagram Username</label>
            </div>
            <input
              type="text"
              placeholder="@username"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value.replace(/^@/, ''))}
              className="bg-neutral-800 border border-neutral-700 focus:border-pink-400 focus:outline-none rounded-lg px-4 py-3 w-full text-neutral-200 text-base"
            />
            {instagram && (
              <p className="mt-2 text-sm text-neutral-500">
                Your Instagram badge will appear next to your name in comments.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-pink-400 hover:bg-pink-300 text-black font-medium rounded-lg py-3 transition-colors disabled:opacity-50 text-base"
          >
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
