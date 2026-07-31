'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getGuestId } from '@/lib/utils';
import type { User } from '@supabase/supabase-js';

const REACTION_TYPES = [
  { type: 'like', emoji: '👍', label: 'Like' },
  { type: 'heart', emoji: '❤️', label: 'Heart' },
  { type: 'bookmark', emoji: '🔖', label: 'Bookmark' }
];

export default function ReactionPicker({ chapterId }: { chapterId: string }) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [activeReactions, setActiveReactions] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();
  const guestId = getGuestId();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    fetchReactions();
  }, [chapterId, supabase]);

  const fetchReactions = async () => {
    const { data: countData, error: countError } = await supabase
      .from('reactions')
      .select('type')
      .eq('chapter_id', chapterId);
      
    if (!countError && countData) {
      const newCounts: Record<string, number> = {};
      countData.forEach(r => {
        newCounts[r.type] = (newCounts[r.type] || 0) + 1;
      });
      setCounts(newCounts);
    }

    const currentUser = (await supabase.auth.getUser()).data.user;
    let query = supabase.from('reactions').select('type').eq('chapter_id', chapterId);
    
    if (currentUser) {
      query = query.eq('user_id', currentUser.id);
    } else {
      query = query.eq('guest_identifier', guestId).is('user_id', null);
    }

    const { data: activeData, error: activeError } = await query;
    if (!activeError && activeData) {
      setActiveReactions(new Set(activeData.map(r => r.type)));
    }
  };

  const toggleReaction = async (type: string) => {
    const isActive = activeReactions.has(type);
    const currentUser = user || (await supabase.auth.getUser()).data.user;
    
    setActiveReactions(prev => {
      const next = new Set(prev);
      if (isActive) next.delete(type);
      else next.add(type);
      return next;
    });
    setCounts(prev => ({
      ...prev,
      [type]: (prev[type] || 0) + (isActive ? -1 : 1)
    }));

    if (isActive) {
      let query = supabase.from('reactions').delete().eq('chapter_id', chapterId).eq('type', type);
      if (currentUser) {
        query = query.eq('user_id', currentUser.id);
      } else {
        query = query.eq('guest_identifier', guestId).is('user_id', null);
      }
      await query;
    } else {
      const data: any = { chapter_id: chapterId, type };
      if (currentUser) {
        data.user_id = currentUser.id;
      } else {
        data.guest_identifier = guestId;
      }
      await supabase.from('reactions').insert(data);
    }
    
    fetchReactions();
  };

  return (
    <div className="flex items-center gap-3 mt-8 font-sans">
      {REACTION_TYPES.map(({ type, emoji, label }) => {
        const isActive = activeReactions.has(type);
        const count = counts[type] || 0;
        
        return (
          <button
            key={type}
            onClick={() => toggleReaction(type)}
            aria-label={label}
            className={`group flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 text-sm border ${
              isActive 
                ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' 
                : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800'
            }`}
          >
            <span className="text-lg group-hover:scale-110 transition-transform">{emoji}</span>
            {count > 0 && (
              <span className={isActive ? 'text-amber-400' : 'text-zinc-400'}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
