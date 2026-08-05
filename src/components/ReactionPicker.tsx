'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getReactionSummary,
  toggleChapterReaction,
} from '@/app/community/actions';

const REACTION_TYPES = [
  { type: 'like', emoji: '👍', label: 'Beğendim' },
  { type: 'heart', emoji: '❤️', label: 'Sevdim' },
  { type: 'bookmark', emoji: '🔖', label: 'Kaydet' },
] as const;

type ReactionType = (typeof REACTION_TYPES)[number]['type'];

export default function ReactionPicker({ chapterId }: { chapterId: string }) {
  const [counts, setCounts] = useState<Record<ReactionType, number>>({
    like: 0,
    heart: 0,
    bookmark: 0,
  });
  const [activeReactions, setActiveReactions] = useState<Set<ReactionType>>(new Set());
  const [pendingType, setPendingType] = useState<ReactionType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshReactions = useCallback(async () => {
    try {
      const summary = await getReactionSummary(chapterId);
      const nextCounts = { like: 0, heart: 0, bookmark: 0 };
      summary.counts.forEach(({ type, count }) => {
        nextCounts[type] = count;
      });
      setCounts(nextCounts);
      setActiveReactions(new Set(summary.active));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Tepkiler yüklenemedi');
    }
  }, [chapterId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void refreshReactions(), 0);
    return () => window.clearTimeout(timeout);
  }, [refreshReactions]);

  const toggleReaction = async (type: ReactionType) => {
    if (pendingType) return;
    const wasActive = activeReactions.has(type);
    setPendingType(type);
    setErrorMessage(null);
    setActiveReactions((current) => {
      const next = new Set(current);
      if (wasActive) next.delete(type);
      else next.add(type);
      return next;
    });
    setCounts((current) => ({
      ...current,
      [type]: Math.max(0, current[type] + (wasActive ? -1 : 1)),
    }));

    try {
      await toggleChapterReaction(chapterId, type);
      await refreshReactions();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Tepki güncellenemedi');
      await refreshReactions();
    } finally {
      setPendingType(null);
    }
  };

  return (
    <div className="mt-8 font-sans">
      <div className="flex items-center gap-3 flex-wrap">
        {REACTION_TYPES.map(({ type, emoji, label }) => {
          const isActive = activeReactions.has(type);
          const count = counts[type];

          return (
            <button
              key={type}
              type="button"
              onClick={() => toggleReaction(type)}
              disabled={pendingType !== null}
              aria-label={label}
              aria-pressed={isActive}
              className={`group flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all duration-200 disabled:opacity-60 ${
                isActive
                  ? 'bg-[#9C0512]/20 border-[#F8D794]/50 text-[#F8D794]'
                  : 'bg-[#64090C]/10 border-[#64090C]/40 hover:border-[#F8D794]/30 text-[#EFEACD]/60'
              }`}
            >
              <span className="text-lg group-hover:scale-110 transition-transform">{emoji}</span>
              <span className={isActive ? 'font-medium' : ''}>{label}</span>
              {count > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#64090C]/30">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {errorMessage && <p className="text-xs text-red-300 mt-3">{errorMessage}</p>}
    </div>
  );
}
