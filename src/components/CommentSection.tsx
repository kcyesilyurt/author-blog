'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import InstagramBadge from '@/components/InstagramBadge';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string | null;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
    instagram_username: string | null;
  };
}

export default function CommentSection({ chapterId }: { chapterId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      fetchComments();
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(display_name, avatar_url, instagram_username)')
      .eq('chapter_id', chapterId)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('Error fetching comments:', error);
    } else {
      setComments(data as any[]);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    // For now, allow anonymous comments if not logged in
    const commentData = {
      chapter_id: chapterId,
      content: newComment,
      user_id: user?.id || null,
    };

    const { error } = await supabase
      .from('comments')
      .insert(commentData);

    if (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment.');
    } else {
      setNewComment('');
      fetchComments();
    }
  };

  return (
    <div className="mt-12">
      <h3 className="text-xl font-serif font-bold text-white mb-6">Comments ({comments.length})</h3>
      
      {/* Comment Form */}
      <div className="mb-10 bg-neutral-900/50 border border-neutral-800 rounded-xl p-5">
        {!user && (
          <div className="mb-4 text-sm text-neutral-400 flex items-center justify-between">
            <span>You are commenting as a Guest.</span>
            <Link href="/auth/signin" className="text-pink-400 hover:text-pink-300 transition-colors">
              Sign in
            </Link>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts on this chapter..."
            className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 resize-none min-h-[100px]"
            required
          />
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="px-5 py-2 bg-pink-400 hover:bg-pink-300 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Post Comment
            </button>
          </div>
        </form>
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {loading ? (
          <p className="text-neutral-500 text-center py-4">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-neutral-500 text-center py-8 bg-neutral-900/30 rounded-xl border border-neutral-800 border-dashed">
            No comments yet. Be the first to share your thoughts!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-4 p-4 rounded-xl bg-neutral-900/30 border border-neutral-800 border-l-2 border-l-pink-400/30">
              <div className="w-10 h-10 rounded-full bg-neutral-800 flex-shrink-0 flex items-center justify-center text-neutral-400 overflow-hidden border border-neutral-700">
                {comment.profiles?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={comment.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-neutral-200 text-sm">
                    {comment.profiles?.display_name || 'Guest User'}
                  </span>
                  
                  {comment.profiles?.instagram_username && (
                    <InstagramBadge username={comment.profiles.instagram_username} />
                  )}
                  
                  {!comment.user_id && (
                    <span className="text-xs bg-neutral-800 text-neutral-500 px-1.5 py-0.5 rounded">Guest</span>
                  )}
                  <span className="text-xs text-neutral-600">
                    {new Date(comment.created_at).toLocaleDateString(undefined, { 
                      month: 'short', day: 'numeric', year: 'numeric' 
                    })}
                  </span>
                </div>
                <p className="text-neutral-300 text-sm whitespace-pre-wrap leading-relaxed">
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
