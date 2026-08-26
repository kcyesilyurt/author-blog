'use server';

import { getScopedActorHash } from '@/lib/rate-limit';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { requireUuid } from '@/lib/validation';

export type PublicationViewType = 'book' | 'chapter';

export async function recordPublicationView(
  contentTypeValue: PublicationViewType,
  contentIdValue: string
): Promise<number> {
  if (!['book', 'chapter'].includes(contentTypeValue)) {
    throw new Error('Sayaç türü geçersiz');
  }

  const contentId = requireUuid(contentIdValue, 'İçerik');
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const actorHash = await getScopedActorHash(
    user?.id ?? null,
    `view:${contentTypeValue}:${contentId}`
  );

  const admin = createAdminClient();
  const { data, error } = await admin.rpc('record_publication_view', {
    p_content_type: contentTypeValue,
    p_content_id: contentId,
    p_actor_hash: actorHash,
  });

  const count = typeof data === 'number' ? data : Number(data);
  if (error || !Number.isSafeInteger(count) || count < 0) {
    throw new Error('Görüntülenme sayısı güncellenemedi');
  }

  return count;
}
