'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

type ReactionType = 'heart' | 'fire' | 'mindblown' | 'tears';

interface ReactionCounts {
  heart: number;
  fire: number;
  mindblown: number;
  tears: number;
}

const REACTION_EMOJIS: Record<ReactionType, string> = {
  heart: '❤️',
  fire: '🔥',
  mindblown: '🤯',
  tears: '😭'
};

export default function ReactionPicker({ chapterId }: { chapterId: string }) {
  const [counts, setCounts] = useState<ReactionCounts>({
    heart: 0,
    fire: 0,
    mindblown: 0,
    tears: 0
  });
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      fetchReactions(user?.id);
    };
    init();
  }, [chapterId, supabase]);

  const fetchReactions = async (userId?: string) => {
    setLoading(true);
    // 1. Get total counts
    // We can do an aggregate query using RPC, or just fetch and count if small scale.
    // For MVP, we'll fetch all reactions for this chapter.
    const { data: allReactions, error } = await supabase
      .from('reactions')
      .select('type, user_id')
      .eq('chapter_id', chapterId);
      
    if (!error && allReactions) {
      const newCounts = { heart: 0, fire: 0, mindblown: 0, tears: 0 };
      let currentUserReaction: ReactionType | null = null;
      
      allReactions.forEach(r => {
        if (r.type in newCounts) {
          newCounts[r.type as ReactionType]++;
        }
        if (userId && r.user_id === userId) {
          currentUserReaction = r.type as ReactionType;
        }
      });
      
      setCounts(newCounts);
      setUserReaction(currentUserReaction);
    }
    setLoading(false);
  };

  const handleReaction = async (type: ReactionType) => {
    if (!user) {
      alert("Please sign in to react to chapters!");
      return;
    }

    if (userReaction === type) {
      // Toggle off
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('chapter_id', chapterId)
        .eq('user_id', user.id);
        
      if (!error) {
        setUserReaction(null);
        setCounts(prev => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }));
      }
    } else {
      // If had previous reaction, this is an upsert (handled by unique constraint + ON CONFLICT DO UPDATE)
      // Or we can delete old and insert new. Supabase allows upsert if we have unique composite key.
      const { error } = await supabase
        .from('reactions')
        .upsert({
          chapter_id: chapterId,
          user_id: user.id,
          type: type
        }, { onConflict: 'chapter_id,user_id' });
        
      if (!error) {
        setCounts(prev => {
          const next = { ...prev };
          if (userReaction) {
            next[userReaction] = Math.max(0, next[userReaction] - 1);
          }
          next[type]++;
          return next;
        });
        setUserReaction(type);
      }
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 py-6 border-y border-neutral-800 mt-12 mb-8">
      <span className="text-sm font-medium text-neutral-400 mr-2">Reactions:</span>
      {(Object.keys(REACTION_EMOJIS) as ReactionType[]).map(type => {
        const isActive = userReaction === type;
        return (
          <button
            key={type}
            onClick={() => handleReaction(type)}
            disabled={loading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
              isActive 
                ? 'bg-pink-400/10 border-pink-400/50 text-pink-300' 
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:border-neutral-700'
            }`}
          >
            <span className="text-lg leading-none">{REACTION_EMOJIS[type]}</span>
            <span className={`text-xs font-semibold ${isActive ? 'text-pink-300' : 'text-neutral-500'}`}>
              {counts[type]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
