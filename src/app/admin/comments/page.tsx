'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import { deleteComment } from '../actions';

interface CommentItem {
  id: string;
  chapter_id: string;
  user_id: string | null;
  guest_name: string | null;
  content: string;
  created_at: string;
  profiles?: { display_name: string } | null;
  chapters?: { title: string; books?: { title: string } | null } | null;
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(display_name), chapters(title, books(title))')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setComments(data as CommentItem[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void fetchComments(), 0);
    return () => window.clearTimeout(timeout);
  }, [fetchComments]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu yorumu silmek istediğinize emin misiniz?')) return;
    try {
      await deleteComment(id);
      await fetchComments();
    } catch (err) {
      console.error(err);
      alert('Yorum silinemedi');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-medium text-white">Yorum Yönetimi</h2>
          <p className="text-sm text-neutral-400">Tüm okuyucu yorumlarını inceleyin ve moderasyon yapın</p>
        </div>
        <span className="text-sm bg-neutral-800 text-neutral-300 px-3 py-1 rounded-full border border-neutral-700">
          Toplam: {comments.length}
        </span>
      </div>

      {loading ? (
        <p className="text-neutral-500 text-sm italic">Yorumlar yükleniyor...</p>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 bg-neutral-900/40 rounded-xl border border-neutral-800">
          <p className="text-neutral-500">Henüz hiç yorum yapılmamış.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-neutral-900/60 rounded-xl p-5 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap text-sm">
                  <span className="font-semibold text-white">
                    {comment.profiles?.display_name || comment.guest_name || 'Anonim'}
                  </span>
                  {!comment.user_id && (
                    <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full border border-neutral-700">
                      Misafir
                    </span>
                  )}
                  <span className="text-neutral-600">•</span>
                  <span className="text-xs text-neutral-400">
                    {comment.chapters?.books?.title ? `${comment.chapters.books.title} / ` : ''}
                    {comment.chapters?.title || 'Bölüm'}
                  </span>
                  <span className="text-neutral-600">•</span>
                  <span className="text-xs text-neutral-500">{formatDate(comment.created_at)}</span>
                </div>
                <p className="text-neutral-300 text-sm leading-relaxed">{comment.content}</p>
              </div>

              <div className="flex items-center justify-end">
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="text-xs bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/60 px-3 py-1.5 rounded-lg transition font-medium"
                >
                  Yorumu Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
