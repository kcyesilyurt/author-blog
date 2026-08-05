'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { enforceRateLimit, getPrimaryActorHash } from '@/lib/rate-limit';
import {
  assertReasonableLinkCount,
  isPubliclyVisible,
  requireText,
  requireUuid,
  type PublicationStatus,
} from '@/lib/validation';
import type {
  Comment,
  CommunityProfile,
  PanoMessage,
  ReactionCount,
} from '@/lib/types';

const REACTION_TYPES = ['like', 'heart', 'bookmark'] as const;
type ReactionType = (typeof REACTION_TYPES)[number];

type CommunityPayload = {
  content: string;
  guestName?: string;
  website?: string;
};

type PublishedChapter = {
  id: string;
  slug: string;
  bookSlug: string;
};

type CommunityRecord = {
  user_id: string | null;
};

async function attachPublicProfiles<T extends CommunityRecord>(
  records: T[]
): Promise<Array<T & { profiles: CommunityProfile | null }>> {
  const userIds = Array.from(
    new Set(records.flatMap((record) => (record.user_id ? [record.user_id] : [])))
  );

  if (userIds.length === 0) {
    return records.map((record) => ({ ...record, profiles: null }));
  }

  const admin = createAdminClient();
  const { data: profiles, error } = await admin
    .from('profiles')
    .select('id, display_name, first_name, last_name, avatar_url, is_admin')
    .in('id', userIds);

  if (error) throw new Error('Kullanıcı adları yüklenemedi');

  const profileMap = new Map<string, CommunityProfile>(
    (profiles ?? []).map((profile) => [
      profile.id,
      {
        display_name: profile.display_name,
        first_name: profile.first_name,
        last_name: profile.last_name,
        avatar_url: profile.avatar_url,
        is_admin: profile.is_admin === true,
      },
    ])
  );

  return records.map((record) => ({
    ...record,
    profiles: record.user_id ? profileMap.get(record.user_id) ?? null : null,
  }));
}

async function getViewer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, isBanned: false, isAdmin: false };

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from('profiles')
    .select('is_banned, is_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !profile) {
    throw new Error('Kullanıcı profili doğrulanamadı');
  }

  return {
    user,
    isBanned: profile.is_banned === true,
    isAdmin: profile.is_admin === true,
  };
}

async function requirePublishedChapter(chapterIdValue: unknown): Promise<PublishedChapter> {
  const chapterId = requireUuid(chapterIdValue, 'Bölüm');
  const admin = createAdminClient();
  const { data: chapter, error: chapterError } = await admin
    .from('chapters')
    .select('id, slug, book_id, status, published_at')
    .eq('id', chapterId)
    .maybeSingle();

  if (chapterError || !chapter) throw new Error('Bölüm bulunamadı');

  const { data: book, error: bookError } = await admin
    .from('books')
    .select('slug, status, published_at')
    .eq('id', chapter.book_id)
    .maybeSingle();

  if (bookError || !book) throw new Error('Eser bulunamadı');

  const chapterVisible = isPubliclyVisible({
    status: chapter.status as PublicationStatus,
    published_at: chapter.published_at,
  });
  const bookVisible = isPubliclyVisible({
    status: book.status as PublicationStatus,
    published_at: book.published_at,
  });

  if (!chapterVisible || !bookVisible) {
    throw new Error('Bu bölüm henüz yayında değil');
  }

  return { id: chapter.id, slug: chapter.slug, bookSlug: book.slug };
}

function validateCommunityPayload(payload: CommunityPayload) {
  if (payload.website?.trim()) {
    throw new Error('İleti gönderilemedi');
  }

  const content = requireText(payload.content, {
    fieldName: 'İleti',
    min: 1,
    max: 2000,
  });
  assertReasonableLinkCount(content);
  return content;
}

function validateGuestName(value: unknown): string {
  return requireText(value, { fieldName: 'İsim', min: 2, max: 50 });
}

export async function getCommunityViewerState() {
  const { user, isBanned, isAdmin } = await getViewer();
  return { isAuthenticated: Boolean(user), isBanned, isAdmin };
}

export async function listChapterComments(chapterIdValue: string): Promise<Comment[]> {
  const chapter = await requirePublishedChapter(chapterIdValue);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('comments')
    .select('id, chapter_id, user_id, guest_name, content, created_at')
    .eq('chapter_id', chapter.id)
    .order('created_at', { ascending: true });

  if (error) throw new Error('Yorumlar yüklenemedi');
  return attachPublicProfiles(data ?? []);
}

export async function listPanoMessages(): Promise<PanoMessage[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('pano_messages')
    .select('id, user_id, guest_name, content, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw new Error('Pano mesajları yüklenemedi');
  return attachPublicProfiles(data ?? []);
}

export async function submitComment(chapterIdValue: string, payload: CommunityPayload) {
  const content = validateCommunityPayload(payload);
  const chapter = await requirePublishedChapter(chapterIdValue);
  const { user, isBanned } = await getViewer();

  if (isBanned) throw new Error('Hesabınız askıya alındığı için yorum yapamazsınız');
  await enforceRateLimit('comment', user?.id ?? null);

  const admin = createAdminClient();
  const { error } = await admin.from('comments').insert({
    chapter_id: chapter.id,
    content,
    user_id: user?.id ?? null,
    guest_name: user ? null : validateGuestName(payload.guestName),
  });

  if (error) throw new Error('Yorum gönderilemedi');
  revalidatePath(`/books/${chapter.bookSlug}/${chapter.slug}`);
}

export async function submitPanoMessage(payload: CommunityPayload) {
  const content = validateCommunityPayload(payload);
  const { user, isBanned } = await getViewer();

  if (isBanned) throw new Error('Hesabınız askıya alındığı için panoya yazamazsınız');
  await enforceRateLimit('pano', user?.id ?? null);

  const admin = createAdminClient();
  const { error } = await admin.from('pano_messages').insert({
    content,
    user_id: user?.id ?? null,
    guest_name: user ? null : validateGuestName(payload.guestName),
  });

  if (error) throw new Error('Pano mesajı gönderilemedi');
  revalidatePath('/pano');
}

export async function getReactionSummary(chapterIdValue: string): Promise<{
  counts: ReactionCount[];
  active: ReactionType[];
}> {
  const chapter = await requirePublishedChapter(chapterIdValue);
  const { user } = await getViewer();
  const admin = createAdminClient();
  const { data: reactions, error } = await admin
    .from('reactions')
    .select('type, user_id, guest_identifier')
    .eq('chapter_id', chapter.id);

  if (error) throw new Error('Tepkiler yüklenemedi');

  const actorHash = user ? null : await getPrimaryActorHash(null);
  const counts = REACTION_TYPES.map((type) => ({
    type,
    count: reactions.filter((reaction) => reaction.type === type).length,
  }));
  const active = reactions
    .filter((reaction) =>
      user ? reaction.user_id === user.id : reaction.guest_identifier === actorHash
    )
    .map((reaction) => reaction.type)
    .filter((type): type is ReactionType =>
      REACTION_TYPES.includes(type as ReactionType)
    );

  return { counts, active };
}

export async function toggleChapterReaction(chapterIdValue: string, typeValue: string) {
  if (!REACTION_TYPES.includes(typeValue as ReactionType)) {
    throw new Error('Tepki türü geçersiz');
  }

  const type = typeValue as ReactionType;
  const chapter = await requirePublishedChapter(chapterIdValue);
  const { user, isBanned } = await getViewer();

  if (isBanned) throw new Error('Hesabınız askıya alındığı için tepki veremezsiniz');
  await enforceRateLimit('reaction', user?.id ?? null);

  const admin = createAdminClient();
  const guestIdentifier = user ? null : await getPrimaryActorHash(null);
  let existingQuery = admin
    .from('reactions')
    .select('id')
    .eq('chapter_id', chapter.id)
    .eq('type', type);

  existingQuery = user
    ? existingQuery.eq('user_id', user.id)
    : existingQuery.eq('guest_identifier', guestIdentifier).is('user_id', null);

  const { data: existing, error: existingError } = await existingQuery.maybeSingle();
  if (existingError) throw new Error('Tepki güncellenemedi');

  if (existing) {
    const { error } = await admin.from('reactions').delete().eq('id', existing.id);
    if (error) throw new Error('Tepki kaldırılamadı');
  } else {
    const { error } = await admin.from('reactions').insert({
      chapter_id: chapter.id,
      type,
      user_id: user?.id ?? null,
      guest_identifier: guestIdentifier,
    });
    if (error && error.code !== '23505') throw new Error('Tepki eklenemedi');
  }

  revalidatePath(`/books/${chapter.bookSlug}/${chapter.slug}`);
  return { active: !existing };
}
