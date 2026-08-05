'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { timeAgo } from '@/lib/utils';
import { appendUniqueById, prependUniqueById } from '@/lib/community-pagination';
import type { Comment, CommunityCursor } from '@/lib/types';
import VerifiedBadge from '@/components/VerifiedBadge';
import CommunityRoleTag from '@/components/CommunityRoleTag';
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
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [nextCursor, setNextCursor] = useState<CommunityCursor | null>(null);
  const [newComment, setNewComment] = useState('');
  const [guestName, setGuestName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const initialLoadTargetRef = useRef<HTMLDivElement>(null);
  const initialLoadPendingRef = useRef(false);
  const loadMorePendingRef = useRef(false);
  const currentChapterIdRef = useRef(chapterId);

  const fetchInitialComments = useCallback(async () => {
    if (initialLoadPendingRef.current) return;

    const requestedChapterId = chapterId;
    initialLoadPendingRef.current = true;
    setLoading(true);
    setErrorMessage(null);
    try {
      const page = await listChapterComments(requestedChapterId);
      if (currentChapterIdRef.current !== requestedChapterId) return;
      setComments(page.items);
      setNextCursor(page.nextCursor);
      setInitialized(true);
    } catch {
      if (currentChapterIdRef.current === requestedChapterId) {
        setErrorMessage('Yorumlar yüklenirken bir sorun oluştu.');
      }
    } finally {
      if (currentChapterIdRef.current === requestedChapterId) {
        initialLoadPendingRef.current = false;
        setLoading(false);
      }
    }
  }, [chapterId]);

  useEffect(() => {
    currentChapterIdRef.current = chapterId;
    initialLoadPendingRef.current = false;
    loadMorePendingRef.current = false;
    let observer: IntersectionObserver | null = null;
    const timeout = window.setTimeout(() => {
      setComments([]);
      setNextCursor(null);
      setInitialized(false);
      setLoading(false);
      setLoadingMore(false);

      const target = initialLoadTargetRef.current;
      if (!target || !('IntersectionObserver' in window)) {
        void fetchInitialComments();
        return;
      }

      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer?.disconnect();
            void fetchInitialComments();
          }
        },
        { rootMargin: '400px 0px' }
      );
      observer.observe(target);
    }, 0);

    return () => {
      window.clearTimeout(timeout);
      observer?.disconnect();
    };
  }, [chapterId, fetchInitialComments]);

  useEffect(() => {
    void getCommunityViewerState()
      .then((viewer) => {
        setIsAuthenticated(viewer.isAuthenticated);
        setIsBanned(viewer.isBanned);
      })
      .catch(() => {
        setIsAuthenticated(false);
        setIsBanned(false);
      });
  }, []);

  const handleLoadMore = async () => {
    if (!nextCursor || loadMorePendingRef.current) return;

    const requestedChapterId = chapterId;
    loadMorePendingRef.current = true;
    setLoadingMore(true);
    setErrorMessage(null);
    try {
      const page = await listChapterComments(requestedChapterId, nextCursor);
      if (currentChapterIdRef.current !== requestedChapterId) return;
      setComments((current) => appendUniqueById(current, page.items));
      setNextCursor(page.nextCursor);
    } catch (error) {
      if (currentChapterIdRef.current === requestedChapterId) {
        setErrorMessage(getErrorMessage(error, 'Daha fazla yorum yüklenemedi.'));
      }
    } finally {
      if (currentChapterIdRef.current === requestedChapterId) {
        loadMorePendingRef.current = false;
        setLoadingMore(false);
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBanned || !newComment.trim() || (!isAuthenticated && !guestName.trim())) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData(event.currentTarget);
      const createdComment = await submitComment(chapterId, {
        content: newComment,
        guestName: isAuthenticated ? undefined : guestName,
        website: String(formData.get('website') ?? ''),
      });
      setNewComment('');
      if (!isAuthenticated) setGuestName('');
      setComments((current) => prependUniqueById(current, createdComment));
      setInitialized(true);
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
      <h3 className="mb-6 text-xl font-semibold text-[#EFEACD]">
        Yorumlar{' '}
        {initialized && (
          <span className="font-normal text-[#EFEACD]/40">
            ({comments.length}{nextCursor ? '+' : ''})
          </span>
        )}
      </h3>

      <div ref={initialLoadTargetRef} className="h-px" aria-hidden="true" />

      {errorMessage && (
        <div className="mb-6 rounded-xl border border-red-800/60 bg-red-950/40 p-4 text-center text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <p className="text-sm italic text-[#EFEACD]/40">Yorumlar yükleniyor...</p>
        ) : initialized && comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="rounded-xl border border-[#64090C]/30 border-l-2 border-l-[#F8D794]/30 bg-[#64090C]/10 p-5">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {comment.profiles?.avatar_url && (
                  <Image src={comment.profiles.avatar_url} alt="" width={24} height={24} className="h-6 w-6 rounded-full border border-[#64090C]/40 object-cover" />
                )}
                <span className="inline-flex items-center gap-1 font-medium text-[#EFEACD]">
                  {getDisplayName(comment)}
                  {comment.profiles?.is_admin && <VerifiedBadge />}
                </span>
                <CommunityRoleTag
                  isAdmin={comment.profiles?.is_admin === true}
                  isRegistered={Boolean(comment.user_id)}
                />
                <span className="text-[#EFEACD]/30">•</span>
                <span className="text-xs text-[#EFEACD]/40">{timeAgo(comment.created_at)}</span>
              </div>
              <p className="whitespace-pre-wrap break-words text-base leading-relaxed text-[#EFEACD]/70">{comment.content}</p>
            </div>
          ))
        ) : initialized ? (
          <p className="text-sm italic text-[#EFEACD]/40">Henüz yorum yapılmamış. İlk yorumu siz yapın!</p>
        ) : errorMessage ? (
          <button
            type="button"
            onClick={() => void fetchInitialComments()}
            className="min-h-12 rounded-lg border border-[#F8D794]/25 px-5 py-3 text-base text-[#F8D794] hover:bg-[#F8D794]/10"
          >
            Tekrar Dene
          </button>
        ) : null}
      </div>

      {nextCursor && !loading && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => void handleLoadMore()}
            disabled={loadingMore}
            className="min-h-12 w-full rounded-lg border border-[#F8D794]/25 px-6 py-3 text-base font-medium text-[#F8D794] transition hover:bg-[#F8D794]/10 disabled:opacity-50 sm:w-auto"
          >
            {loadingMore ? 'Yükleniyor...' : 'Daha Fazla Yükle'}
          </button>
        </div>
      )}

      {isBanned ? (
        <div className="mt-8 rounded-xl border border-red-800/50 bg-red-950/30 p-4 text-center text-sm text-red-300">
          Hesabınız askıya alındığı için yorum yapamazsınız.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-card mt-8 rounded-xl border border-[#64090C]/30 bg-[#64090C]/10 p-6">
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />
          {!isAuthenticated && (
            <div className="mb-4">
              <label htmlFor="comment-guest-name" className="mb-2 block text-base font-medium text-[#EFEACD]/70">
                İsminiz
              </label>
              <input
                id="comment-guest-name"
                type="text"
                placeholder="İsminiz (gerekli)"
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                minLength={2}
                maxLength={50}
                className="min-h-12 w-full rounded-lg border border-[#64090C]/30 bg-[#64090C]/20 px-4 py-3 font-sans text-base text-[#EFEACD] placeholder:text-[#EFEACD]/30 transition-colors focus:border-[#F8D794] focus:outline-none"
                required
              />
            </div>
          )}
          <label htmlFor="comment-content" className="mb-2 block text-base font-medium text-[#EFEACD]/70">
            Yorumunuz
          </label>
          <textarea
            id="comment-content"
            placeholder="Düşüncelerinizi paylaşın..."
            value={newComment}
            onChange={(event) => setNewComment(event.target.value)}
            maxLength={2000}
            className="min-h-[120px] w-full resize-y rounded-lg border border-[#64090C]/40 bg-[#64090C]/15 px-4 py-3 font-sans text-base text-[#EFEACD] placeholder:text-[#EFEACD]/30 transition-colors focus:border-[#9C0512] focus:outline-none"
            required
          />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-[#EFEACD]/30">{newComment.length}/2000</span>
            <button
              type="submit"
              disabled={submitting || !newComment.trim() || (!isAuthenticated && !guestName.trim())}
              className="min-h-12 w-full rounded-lg bg-[#9C0512] px-5 py-3 text-base font-medium text-[#F8D794] transition-colors hover:bg-[#7a040e] disabled:opacity-50 sm:w-auto"
            >
              {submitting ? 'Gönderiliyor...' : 'Yorum Gönder'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
