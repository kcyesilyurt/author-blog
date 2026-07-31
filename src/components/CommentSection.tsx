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
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    fetchComments();
  }, [chapterId, supabase]);

  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(display_name, avatar_url)')
      .eq('chapter_id', chapterId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setComments(data as Comment[]);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <section className="mt-16 border-t border-zinc-800 pt-8 font-sans">
      <h3 className="text-xl font-semibold text-zinc-100 mb-6">
        Comments <span className="text-zinc-500 font-normal">({comments.length})</span>
      </h3>

      <div className="space-y-4">
        {loading ? (
          <p className="text-zinc-500 text-sm italic">Loading comments...</p>
        ) : comments.length > 0 ? (
          comments.map(comment => (
            <div key={comment.id} className="bg-zinc-900 rounded-lg p-5 border-l-2 border-amber-500/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-zinc-200">
                  {comment.profiles?.display_name || comment.guest_name || 'Anonymous'}
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-xs text-zinc-500">{timeAgo(comment.created_at)}</span>
              </div>
              <p className="text-zinc-300 text-base leading-relaxed">{comment.content}</p>
            </div>
          ))
        ) : (
          <p className="text-zinc-500 text-sm italic">No comments yet. Be the first to share your thoughts!</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-8 bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
        {!user && (
          <input
            type="text"
            placeholder="Your name (optional)"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="mb-4 bg-zinc-800 border border-zinc-700 focus:border-amber-500 focus:outline-none rounded-lg px-4 py-2.5 w-full text-zinc-200 placeholder:text-zinc-500 transition-colors font-sans text-sm"
            required={!user}
          />
        )}
        <textarea
          placeholder="Share your thoughts..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 focus:border-amber-500 focus:outline-none rounded-lg px-4 py-2.5 w-full text-zinc-200 placeholder:text-zinc-500 transition-colors font-sans text-sm min-h-[120px] resize-y"
          required
        />
        <div className="flex justify-end mt-3">
          <button
            type="submit"
            disabled={submitting || (!newComment.trim()) || (!user && !guestName.trim())}
            className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-medium rounded-lg px-5 py-2.5 text-sm transition-colors disabled:opacity-50"
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>
    </section>
  );
}
