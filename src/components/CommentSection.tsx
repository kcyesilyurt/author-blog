'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { timeAgo } from '@/lib/utils';
import type { User } from '@supabase/supabase-js';
import type { Comment } from '@/lib/types';

export default function CommentSection({ chapterId }: { chapterId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [guestName, setGuestName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isBanned, setIsBanned] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_banned')
          .eq('id', data.user.id)
          .single();
        if (profile?.is_banned) {
          setIsBanned(true);
        }
      }
    });
    fetchComments();
  }, [chapterId, supabase]);

  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(display_name, avatar_url, is_banned)')
      .eq('chapter_id', chapterId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setComments(data as Comment[]);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBanned) return;
    if (!newComment.trim()) return;
    if (!user && !guestName.trim()) return;

    setSubmitting(true);
    const commentData: Partial<Comment> = {
      chapter_id: chapterId,
      content: newComment.trim(),
    };

    if (user) {
      commentData.user_id = user.id;
    } else {
      commentData.guest_name = guestName.trim();
    }

    const { error } = await supabase.from('comments').insert(commentData);

    if (!error) {
      setNewComment('');
      if (!user) setGuestName('');
      await fetchComments();
    }
    setSubmitting(false);
  };

  return (
    <section className="mt-16 border-t border-neutral-800 pt-8 font-sans">
      <h3 className="text-xl font-semibold text-white mb-6">
        Yorumlar <span className="text-neutral-500 font-normal">({comments.length})</span>
      </h3>

      <div className="space-y-4">
        {loading ? (
          <p className="text-neutral-500 text-sm italic">Yorumlar yükleniyor...</p>
        ) : comments.length > 0 ? (
          comments.map(comment => (
            <div key={comment.id} className="bg-neutral-900/60 rounded-xl p-5 border-l-2 border-pink-400/40 border-r border-t border-b border-neutral-800/80">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="font-medium text-neutral-200">
                  {comment.profiles?.display_name || comment.guest_name || 'Anonim'}
                </span>
                {!comment.user_id && (
                  <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full border border-neutral-700">
                    Ziyaretçi
                  </span>
                )}
                <span className="text-neutral-600">•</span>
                <span className="text-xs text-neutral-500">{timeAgo(comment.created_at)}</span>
              </div>
              <p className="text-neutral-300 text-base leading-relaxed">{comment.content}</p>
            </div>
          ))
        ) : (
          <p className="text-neutral-500 text-sm italic">Henüz yorum yapılmamış. İlk yorumu siz yapın!</p>
        )}
      </div>

      {isBanned ? (
        <div className="mt-8 bg-red-950/30 border border-red-800/50 rounded-xl p-4 text-center text-red-400 text-sm">
          Hesabınız askıya alındığı için yorum yapamazsınız.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 glass-card bg-neutral-900/40 rounded-xl p-6 border border-neutral-800">
          {!user && (
            <input
              type="text"
              placeholder="İsminiz (gerekli)"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="mb-4 bg-neutral-800 border border-neutral-700 focus:border-pink-400 focus:outline-none rounded-lg px-4 py-2.5 w-full text-neutral-200 placeholder:text-neutral-500 transition-colors font-sans text-sm"
              required={!user}
            />
          )}
          <textarea
            placeholder="Düşüncelerinizi paylaşın..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="bg-neutral-800 border border-neutral-700 focus:border-pink-400 focus:outline-none rounded-lg px-4 py-2.5 w-full text-neutral-200 placeholder:text-neutral-500 transition-colors font-sans text-sm min-h-[120px] resize-y"
            required
          />
          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={submitting || (!newComment.trim()) || (!user && !guestName.trim())}
              className="bg-pink-400 hover:bg-pink-300 text-black font-medium rounded-lg px-5 py-2.5 text-sm transition-colors disabled:opacity-50"
            >
              {submitting ? 'Gönderiliyor...' : 'Yorum Gönder'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
