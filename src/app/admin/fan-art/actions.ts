'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/admin';
import {
  cleanupDueFanArtObjects,
  enqueueFanArtCleanup,
} from '@/lib/fan-art-cleanup';
import {
  fanArtCursorFilter,
  parseFanArtCursor,
} from '@/lib/fan-art-pagination';
import { createImageObjectName, validateStoredImage } from '@/lib/image-upload';
import { createAdminClient } from '@/lib/supabase/admin';
import type {
  ActionResult,
  AdminFanArtItem,
  AdminPublishedFanArtItem,
  AdminPublishedFanArtPage,
  FanArtCursor,
} from '@/lib/types';
import { FAN_ART_DERIVATIVE_MAX_BYTES } from '@/lib/upload-limits';
import { requireText } from '@/lib/validation';

type FanArtProfile = {
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
};

const ADMIN_PUBLISHED_PAGE_SIZE = 50;

function requireFanArtId(value: unknown): number {
  const normalized =
    typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
  if (
    typeof normalized !== 'number' ||
    !Number.isSafeInteger(normalized) ||
    normalized <= 0
  ) {
    throw new Error('Fan art kaydı geçersiz');
  }
  return normalized;
}

function matchesFanArtId(value: unknown, expected: number): boolean {
  try {
    return requireFanArtId(value) === expected;
  } catch {
    return false;
  }
}

function artistName(profile: FanArtProfile | undefined): string {
  if (profile?.first_name?.trim()) {
    const lastInitial = profile.last_name?.trim().charAt(0);
    return `${profile.first_name.trim()}${lastInitial ? ` ${lastInitial}.` : ''}`;
  }
  return profile?.display_name?.trim() || 'Bir okur';
}

async function listPendingFanArtImpl(): Promise<AdminFanArtItem[]> {
  await requireAdmin();
  const admin = createAdminClient();
  await cleanupDueFanArtObjects(admin);
  const { data: rows, error } = await admin
    .from('fan_art_submissions')
    .select(
      'id, user_id, title, caption, alt_text, staging_path, width, height, submitted_at'
    )
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true })
    .order('id', { ascending: true })
    .limit(50);

  if (error) throw new Error('Fan art inceleme sırası yüklenemedi');
  if (!rows?.length) return [];

  const paths = rows.map((row) => row.staging_path).filter(Boolean) as string[];
  const { data: signedRows, error: signedError } = await admin.storage
    .from('fan-art-staging')
    .createSignedUrls(paths, 15 * 60);
  if (signedError) throw new Error('Fan art önizlemeleri oluşturulamadı');

  const signedUrlByPath = new Map(
    (signedRows ?? []).flatMap((row) =>
      row.path && row.signedUrl ? [[row.path, row.signedUrl] as const] : []
    )
  );
  const userIds = Array.from(new Set(rows.map((row) => row.user_id)));
  const { data: profiles, error: profileError } = await admin
    .from('profiles')
    .select('id, display_name, first_name, last_name')
    .in('id', userIds);
  if (profileError) throw new Error('Fan art sanatçıları yüklenemedi');

  const profileMap = new Map<string, FanArtProfile>(
    (profiles ?? []).map((profile) => [profile.id, profile])
  );

  return rows.map((row) => {
    const previewUrl = row.staging_path
      ? signedUrlByPath.get(row.staging_path)
      : undefined;
    if (!previewUrl || !row.width || !row.height || !row.submitted_at) {
      throw new Error('Fan art inceleme kaydı eksik');
    }

    return {
      id: requireFanArtId(row.id),
      title: row.title,
      caption: row.caption,
      altText: row.alt_text,
      previewUrl,
      width: row.width,
      height: row.height,
      submittedAt: row.submitted_at,
      artistName: artistName(profileMap.get(row.user_id)),
    };
  });
}

async function listPublishedFanArtImpl(
  cursorValue?: FanArtCursor | null
): Promise<AdminPublishedFanArtPage> {
  await requireAdmin();
  const admin = createAdminClient();
  const cursor = parseFanArtCursor(cursorValue);
  let query = admin
    .from('fan_art_submissions')
    .select(
      'id, user_id, title, alt_text, public_path, width, height, moderated_at'
    )
    .eq('status', 'approved');

  if (cursor) query = query.or(fanArtCursorFilter(cursor));

  const { data: rows, error } = await query
    .order('moderated_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(ADMIN_PUBLISHED_PAGE_SIZE + 1);

  if (error) throw new Error('Yayındaki fan art listesi yüklenemedi');
  if (!rows?.length) return { items: [], nextCursor: null };

  const visibleRows = rows.slice(0, ADMIN_PUBLISHED_PAGE_SIZE);

  const userIds = Array.from(new Set(visibleRows.map((row) => row.user_id)));
  const { data: profiles, error: profileError } = await admin
    .from('profiles')
    .select('id, display_name, first_name, last_name')
    .in('id', userIds);
  if (profileError) throw new Error('Fan art sanatçıları yüklenemedi');

  const profileMap = new Map<string, FanArtProfile>(
    (profiles ?? []).map((profile) => [profile.id, profile])
  );

  const items: AdminPublishedFanArtItem[] = visibleRows.map((row) => {
    if (!row.public_path || !row.width || !row.height || !row.moderated_at) {
      throw new Error('Yayındaki fan art kaydı eksik');
    }

    return {
      id: requireFanArtId(row.id),
      title: row.title,
      altText: row.alt_text,
      imageUrl: admin.storage.from('fan-art').getPublicUrl(row.public_path).data
        .publicUrl,
      width: row.width,
      height: row.height,
      publishedAt: row.moderated_at,
      artistName: artistName(profileMap.get(row.user_id)),
    };
  });

  const lastItem = items.at(-1);
  return {
    items,
    nextCursor:
      rows.length > ADMIN_PUBLISHED_PAGE_SIZE && lastItem
        ? { moderatedAt: lastItem.publishedAt, id: lastItem.id }
        : null,
  };
}

async function approveFanArtImpl(submissionIdValue: number): Promise<void> {
  const actor = await requireAdmin();
  const submissionId = requireFanArtId(submissionIdValue);
  const admin = createAdminClient();
  const { data: submission, error } = await admin
    .from('fan_art_submissions')
    .select('id, user_id, status, staging_path')
    .eq('id', submissionId)
    .maybeSingle();

  if (error || !submission) throw new Error('Fan art kaydı bulunamadı');
  if (submission.status === 'approved') return;
  if (submission.status !== 'pending' || !submission.staging_path) {
    throw new Error('Yalnızca incelemedeki fan art onaylanabilir');
  }

  const { data: source, error: downloadError } = await admin.storage
    .from('fan-art-staging')
    .download(submission.staging_path);
  if (downloadError || !source) throw new Error('Fan art önizlemesi okunamadı');
  await validateStoredImage(source, 'image/webp', FAN_ART_DERIVATIVE_MAX_BYTES);

  const publicPath = `${submission.user_id}/${createImageObjectName('webp')}`;
  await enqueueFanArtCleanup(admin, 'fan-art', publicPath);
  const publicBytes = Buffer.from(await source.arrayBuffer());
  const { error: uploadError } = await admin.storage
    .from('fan-art')
    .upload(publicPath, publicBytes, {
      cacheControl: '3600',
      contentType: 'image/webp',
      upsert: false,
    });
  if (uploadError) {
    await enqueueFanArtCleanup(admin, 'fan-art', publicPath, 0);
    await cleanupDueFanArtObjects(admin);
    throw new Error('Onaylanan fan art yayımlanamadı');
  }

  const { data: approvedId, error: updateError } = await admin.rpc(
    'approve_fan_art_submission',
    {
      p_submission_id: submissionId,
      p_moderated_by: actor.id,
      p_public_path: publicPath,
    }
  );

  // Also drain after an ambiguous RPC response: if Postgres committed but the
  // response was lost, the durable outbox still makes the Storage operation safe.
  await cleanupDueFanArtObjects(admin);

  if (updateError || !matchesFanArtId(approvedId, submissionId)) {
    // The provisional cleanup row and the approval transition are coordinated
    // in Postgres. On an ambiguous network result, recreating the job here
    // could delete an approval that actually committed.
    throw new Error('Fan art onayı kaydedilemedi');
  }

  revalidatePath('/fan-art');
  revalidatePath('/admin/fan-art');
}

async function rejectFanArtImpl(
  submissionIdValue: number,
  reasonValue: string
): Promise<void> {
  const actor = await requireAdmin();
  const submissionId = requireFanArtId(submissionIdValue);
  const reason = requireText(reasonValue, {
    fieldName: 'Ret nedeni',
    min: 2,
    max: 500,
  });
  const admin = createAdminClient();
  const { data: submission, error } = await admin
    .from('fan_art_submissions')
    .select('status, staging_path')
    .eq('id', submissionId)
    .maybeSingle();

  if (error || !submission) throw new Error('Fan art kaydı bulunamadı');
  if (submission.status === 'rejected') return;
  if (submission.status !== 'pending' || !submission.staging_path) {
    throw new Error('Yalnızca incelemedeki fan art reddedilebilir');
  }

  const { data: rejectedId, error: updateError } = await admin.rpc(
    'reject_fan_art_submission',
    {
      p_submission_id: submissionId,
      p_moderated_by: actor.id,
      p_reason: reason,
    }
  );

  await cleanupDueFanArtObjects(admin);

  if (updateError || !matchesFanArtId(rejectedId, submissionId)) {
    throw new Error('Fan art reddi kaydedilemedi');
  }

  revalidatePath('/fan-art');
  revalidatePath('/admin/fan-art');
}

async function takeDownFanArtImpl(
  submissionIdValue: number,
  reasonValue: string
): Promise<void> {
  const actor = await requireAdmin();
  const submissionId = requireFanArtId(submissionIdValue);
  const reason = requireText(reasonValue, {
    fieldName: 'Yayından kaldırma nedeni',
    min: 2,
    max: 500,
  });
  const admin = createAdminClient();
  const { data: removedId, error } = await admin.rpc(
    'take_down_fan_art_submission',
    {
      p_submission_id: submissionId,
      p_removed_by: actor.id,
      p_reason: reason,
    }
  );

  await cleanupDueFanArtObjects(admin);

  if (error || !matchesFanArtId(removedId, submissionId)) {
    throw new Error('Fan art yayından kaldırılamadı');
  }
  revalidatePath('/fan-art');
  revalidatePath('/admin/fan-art');
}

function adminFanArtError(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim()
    ? error.message
    : fallback;
}

async function adminFanArtResult<T>(
  operation: () => Promise<T>,
  fallback: string
): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await operation() };
  } catch (error) {
    return { ok: false, error: adminFanArtError(error, fallback) };
  }
}

export async function listPendingFanArt(): Promise<
  ActionResult<AdminFanArtItem[]>
> {
  return adminFanArtResult(
    listPendingFanArtImpl,
    'Fan art inceleme sırası yüklenemedi'
  );
}

export async function listPublishedFanArt(
  cursorValue?: FanArtCursor | null
): Promise<
  ActionResult<AdminPublishedFanArtPage>
> {
  return adminFanArtResult(
    () => listPublishedFanArtImpl(cursorValue),
    'Yayındaki fan art listesi yüklenemedi'
  );
}

export async function approveFanArt(
  submissionIdValue: number
): Promise<ActionResult<null>> {
  return adminFanArtResult(async () => {
    await approveFanArtImpl(submissionIdValue);
    return null;
  }, 'Fan art onaylanamadı');
}

export async function rejectFanArt(
  submissionIdValue: number,
  reasonValue: string
): Promise<ActionResult<null>> {
  return adminFanArtResult(async () => {
    await rejectFanArtImpl(submissionIdValue, reasonValue);
    return null;
  }, 'Fan art reddedilemedi');
}

export async function takeDownFanArt(
  submissionIdValue: number,
  reasonValue: string
): Promise<ActionResult<null>> {
  return adminFanArtResult(async () => {
    await takeDownFanArtImpl(submissionIdValue, reasonValue);
    return null;
  }, 'Fan art yayından kaldırılamadı');
}
