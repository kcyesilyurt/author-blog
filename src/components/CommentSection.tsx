'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { timeAgo } from '@/lib/utils';
import type { Comment } from '@/lib/types';
import VerifiedBadge from '@/components/VerifiedBadge';
import {
  getCommunityViewerState,
  listChapterComments,
  submitComment,
} from '@/app/community/actions';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function CommentSection({ chapterId }: { chapterId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [guestName, setGuestName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      setComments(await listChapterComments(chapterId));
    } catch {
      setErrorMessage('Yorumlar yüklenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  }, [chapterId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void fetchComments(), 0);
    void getCommunityViewerState()
      .then((viewer) => {
        setIsAuthenticated(viewer.isAuthenticated);
        setIsBanned(viewer.isBanned);
      })
      .catch(() => {
        setIsAuthenticated(false);
        setIsBanned(false);
      });
    return () => window.clearTimeout(timeout);
  }, [fetchComments]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBanned || !newComment.trim() || (!isAuthenticated && !guestName.trim())) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData(event.currentTarget);
      await submitComment(chapterId, {
        content: newComment,
        guestName: isAuthenticated ? undefined : guestName,
        website: String(formData.get('website') ?? ''),
      });
      setNewComment('');
      if (!isAuthenticated) setGuestName('');
      await fetchComments();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Yorum gönderilemedi.'));
    } finally {
      setSubmitting(false);
    }
  };

  const getDisplayName = (comment: Comment) => {
    if (comment.profiles?.first_name) {
      const lastInitial = comment.profiles.last_name
        ? ` ${comment.profiles.last_name.trim().charAt(0)}.`
        : '';
      return `${comment.profiles.first_name.trim()}${lastInitial}`;
    }
    if (comment.profiles?.display_name) {
      const parts = comment.profiles.display_name.trim().split(/\s+/);
      return parts.length > 1
        ? `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`
        : parts[0];
    }
    return comment.guest_name?.trim() || (comment.user_id ? 'Okur' : 'Anonim');
  };

  return (
    <section className="mt-16 border-t border-[#64090C]/30 pt-8 font-sans">
      <h3 className="text-xl font-semibold text-[#EFEACD] mb-6">
        Yorumlar <span className="text-[#EFEACD]/40 font-normal">({comments.length})</span>
      </h3>

      {errorMessage && (
        <div className="mb-6 bg-red-950/40 border border-red-800/60 rounded-xl p-4 text-red-300 text-sm text-center">
          {errorMessage}
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <p className="text-[#EFEACD]/40 text-sm italic">Yorumlar yükleniyor...</p>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="bg-[#64090C]/10 rounded-xl p-5 border-l-2 border-[#F8D794]/30 border-r border-t border-b border-[#64090C]/30">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {comment.profiles?.avatar_url && (
                  <Image src={comment.profiles.avatar_url} alt="" width={24} height={24} className="w-6 h-6 rounded-full object-cover border border-[#64090C]/40" />
                )}
                <span className="font-medium text-[#EFEACD] inline-flex items-center gap-1">
                  {getDisplayName(comment)}
                  {comment.profiles?.is_admin && <VerifiedBadge />}
                </span>
                <span className="text-xs bg-[#64090C]/15 text-[#EFEACD]/50 px-2 py-0.5 rounded-full border border-[#64090C]/40">
                  {comment.user_id ? 'Okur' : 'Misafir'}
                </span>
                <span className="text-[#EFEACD]/30">•</span>
                <span className="text-xs text-[#EFEACD]/40">{timeAgo(comment.created_at)}</span>
              </div>
              <p className="text-[#EFEACD]/70 text-base leading-relaxed whitespace-pre-wrap break-words">{comment.content}</p>
            </div>
          ))
        ) : (
          <p className="text-[#EFEACD]/40 text-sm italic">Henüz yorum yapılmamış. İlk yorumu siz yapın!</p>
        )}
      </div>

      {isBanned ? (
        <div className="mt-8 bg-red-950/30 border border-red-800/50 rounded-xl p-4 text-center text-red-300 text-sm">
          Hesabınız askıya alındığı için yorum yapamazsınız.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 glass-card bg-[#64090C]/10 rounded-xl p-6 border border-[#64090C]/30">
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />
          {!isAuthenticated && (
            <input
              type="text"
              placeholder="İsminiz (gerekli)"
              value={guestName}
              onChange={(event) => setGuestName(event.target.value)}
              minLength={2}
              maxLength={50}
              className="mb-4 bg-[#64090C]/15 border border-[#64090C]/40 focus:border-[#9C0512] focus:outline-none rounded-lg px-4 py-2.5 w-full text-[#EFEACD] placeholder:text-[#EFEACD]/30 transition-colors font-sans text-sm"
              required
            />
          )}
          <textarea
            placeholder="Düşüncelerinizi paylaşın..."
            value={newComment}
            onChange={(event) => setNewComment(event.target.value)}
            maxLength={2000}
            className="bg-[#64090C]/15 border border-[#64090C]/40 focus:border-[#9C0512] focus:outline-none rounded-lg px-4 py-2.5 w-full text-[#EFEACD] placeholder:text-[#EFEACD]/30 transition-colors font-sans text-sm min-h-[120px] resize-y"
            required
          />
          <div className="flex items-center justify-between gap-4 mt-3">
            <span className="text-xs text-[#EFEACD]/30">{newComment.length}/2000</span>
            <button
              type="submit"
              disabled={submitting || !newComment.trim() || (!isAuthenticated && !guestName.trim())}
              className="bg-[#9C0512] hover:bg-[#7a040e] text-[#F8D794] font-medium rounded-lg px-5 py-2.5 text-sm transition-colors disabled:opacity-50"
            >
              {submitting ? 'Gönderiliyor...' : 'Yorum Gönder'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
