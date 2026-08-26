'use server';

import { randomUUID } from 'node:crypto';
import {
  FAN_ART_OWN_PAGE_SIZE,
  FAN_ART_PAGE_SIZE,
  fanArtCursorFilter,
  fanArtOwnCursorFilter,
  parseFanArtCursor,
  parseFanArtOwnCursor,
  toFanArtPage,
  toFanArtOwnPage,
} from '@/lib/fan-art-pagination';
import {
  cleanupDueFanArtObjects,
  enqueueFanArtCleanup,
} from '@/lib/fan-art-cleanup';
import { sanitizeFanArtImage } from '@/lib/fan-art-image';
import {
  createImageObjectName,
  getImageMimeFromObjectPath,
  validateImageMetadata,
  validateStoredImage,
} from '@/lib/image-upload';
import { enforceRateLimit } from '@/lib/rate-limit';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type {
  ActionResult,
  FanArtCursor,
  FanArtOwnCursor,
  FanArtOwnItem,
  FanArtOwnPage,
  FanArtOwnStatus,
  FanArtPublicItem,
  FanArtPublicPage,
} from '@/lib/types';
import { FAN_ART_IMAGE_MAX_BYTES } from '@/lib/upload-limits';
import { optionalText, requireText } from '@/lib/validation';

const FAN_ART_TERMS_VERSION = '2026-08-20';

type FanArtUploadRequest = {
  title: string;
  caption?: string;
  altText: string;
  rightsConfirmed: boolean;
  mime: string;
  size: number;
};

type FanArtProfile = {
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
};

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

  if (profile?.display_name?.trim()) {
    const parts = profile.display_name.trim().split(/\s+/);
    const lastInitial = parts.at(-1)?.charAt(0) ?? '';
    return parts.length > 1
      ? `${parts[0]} ${lastInitial}.`
      : parts[0];
  }

  return 'Bir okur';
}

function validateUploadRequest(request: FanArtUploadRequest) {
  if (request?.rightsConfirmed !== true) {
    throw new Error('Yalnızca paylaşma hakkına sahip olduğunuz çalışmaları yükleyebilirsiniz');
  }

  const title = requireText(request?.title, {
    fieldName: 'Başlık',
    min: 2,
    max: 100,
  });
  const caption = optionalText(request?.caption, 500);
  const altText = requireText(request?.altText, {
    fieldName: 'Görsel açıklaması',
    min: 5,
    max: 180,
  });
  const image = validateImageMetadata(
    request?.mime,
    request?.size,
    FAN_ART_IMAGE_MAX_BYTES
  );

  return { title, caption, altText, ...image, size: request.size };
}

async function getFanArtContext({ allowBanned = false } = {}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Fan art göndermek için giriş yapın');

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from('profiles')
    .select('display_name, first_name, last_name, is_banned')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !profile) throw new Error('Kullanıcı profili doğrulanamadı');
  if (profile.is_banned && !allowBanned) {
    throw new Error('Askıya alınan hesaplar fan art gönderemez');
  }

  return { supabase, admin, user, profile };
}

async function releaseProcessingClaim(
  admin: ReturnType<typeof createAdminClient>,
  submissionId: number,
  userId: string,
  uploadPath: string,
  processingToken: string,
  status: 'uploading' | 'cancelled'
) {
  await admin
    .from('fan_art_submissions')
    .update({
      status,
      staging_path: uploadPath,
      processing_started_at: null,
      processing_token: null,
    })
    .eq('id', submissionId)
    .eq('user_id', userId)
    .eq('status', 'processing')
    .eq('upload_path', uploadPath)
    .eq('processing_token', processingToken);
}

async function getFanArtViewerStateImpl(): Promise<{
  isAuthenticated: boolean;
  isBanned: boolean;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { isAuthenticated: false, isBanned: false };

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from('profiles')
    .select('is_banned')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !profile) throw new Error('Kullanıcı profili doğrulanamadı');
  return { isAuthenticated: true, isBanned: profile.is_banned === true };
}

async function createFanArtUploadTicketImpl(
  request: FanArtUploadRequest
): Promise<{ submissionId: number; path: string; token: string }> {
  const { admin, user } = await getFanArtContext();
  const validated = validateUploadRequest(request);

  await enforceRateLimit('fan_art_upload', user.id);
  await cleanupDueFanArtObjects(admin);

  const path = `${user.id}/${createImageObjectName(validated.extension)}`;
  const { data: reservation, error: reservationError } = await admin.rpc(
    'reserve_fan_art_submission',
    {
      p_user_id: user.id,
      p_title: validated.title,
      p_caption: validated.caption,
      p_alt_text: validated.altText,
      p_upload_path: path,
      p_mime_type: validated.mime,
      p_size_bytes: validated.size,
      p_terms_version: FAN_ART_TERMS_VERSION,
    }
  );

  if (reservationError) {
    if (reservationError.message.includes('fan art active submission limit reached')) {
      throw new Error('Aynı anda en fazla 5 çalışma incelemede olabilir');
    }
    throw new Error('Fan art kaydı oluşturulamadı');
  }
  const submissionId = requireFanArtId(reservation);

  const { data: ticket, error: ticketError } = await admin.storage
    .from('fan-art-staging')
    .createSignedUploadUrl(path, { upsert: false });

  if (ticketError || !ticket?.token) {
    const { error: reservationDeleteError } = await admin
      .from('fan_art_submissions')
      .delete()
      .eq('id', submissionId);
    if (!reservationDeleteError) {
      await admin
        .from('fan_art_storage_cleanup_jobs')
        .delete()
        .eq('bucket_id', 'fan-art-staging')
        .eq('object_path', path);
    }
    throw new Error('Fan art yükleme izni oluşturulamadı');
  }

  return { submissionId, path, token: ticket.token };
}

async function cancelFanArtUploadImpl(submissionIdValue: number): Promise<void> {
  const submissionId = requireFanArtId(submissionIdValue);
  const { admin, user } = await getFanArtContext({ allowBanned: true });
  await admin
    .from('fan_art_submissions')
    .update({ status: 'cancelled' })
    .eq('id', submissionId)
    .eq('user_id', user.id)
    .eq('status', 'uploading');
}

async function finalizeFanArtUploadImpl(
  submissionIdValue: number
): Promise<FanArtOwnItem> {
  const submissionId = requireFanArtId(submissionIdValue);
  const { admin, user } = await getFanArtContext();
  const { data: submission, error: submissionError } = await admin
    .from('fan_art_submissions')
    .select(
      'id, title, status, upload_path, staging_path, mime_type, created_at, rejection_reason, removal_reason'
    )
    .eq('id', submissionId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (submissionError || !submission) throw new Error('Fan art kaydı bulunamadı');
  if (['pending', 'approved', 'rejected', 'removed'].includes(submission.status)) {
    return {
      id: requireFanArtId(submission.id),
      title: submission.title,
      status: submission.status as FanArtOwnStatus,
      createdAt: submission.created_at,
      moderationReason:
        submission.status === 'removed'
          ? submission.removal_reason
          : submission.rejection_reason,
    };
  }
  if (!['uploading', 'processing'].includes(submission.status)) {
    throw new Error('Bu fan art yüklemesi artık kullanılamıyor');
  }

  const uploadPath = submission.upload_path;
  const sourceMime = getImageMimeFromObjectPath(uploadPath, user.id);
  if (
    !uploadPath ||
    submission.staging_path !== uploadPath ||
    !sourceMime ||
    sourceMime !== submission.mime_type
  ) {
    throw new Error('Fan art dosya yolu geçersiz');
  }

  const processingToken = randomUUID();
  const { data: claimedId, error: claimError } = await admin.rpc(
    'claim_fan_art_processing',
    {
      p_submission_id: submissionId,
      p_user_id: user.id,
      p_upload_path: uploadPath,
      p_processing_token: processingToken,
    }
  );
  if (claimError || !matchesFanArtId(claimedId, submissionId)) {
    throw new Error('Bu fan art başka bir istek tarafından işleniyor');
  }

  const { data: source, error: downloadError } = await admin.storage
    .from('fan-art-staging')
    .download(uploadPath);
  if (downloadError || !source) {
    // A signed-upload ticket without an object must not be reusable as an
    // unlimited Storage-download amplifier. The browser creates a fresh
    // ticket after any failed upload/finalize attempt, while the durable
    // cleanup job keeps tracking this path until the signed token expires.
    await releaseProcessingClaim(
      admin,
      submissionId,
      user.id,
      uploadPath,
      processingToken,
      'cancelled'
    );
    throw new Error('Yüklenen fan art görseli okunamadı');
  }

  let sanitized;
  try {
    await validateStoredImage(source, sourceMime, FAN_ART_IMAGE_MAX_BYTES);
    sanitized = await sanitizeFanArtImage(source);
  } catch (error) {
    await releaseProcessingClaim(
      admin,
      submissionId,
      user.id,
      uploadPath,
      processingToken,
      'cancelled'
    );
    throw error;
  }

  const sanitizedPath = `${user.id}/${createImageObjectName('webp')}`;
  try {
    await enqueueFanArtCleanup(admin, 'fan-art-staging', sanitizedPath);
  } catch (error) {
    await releaseProcessingClaim(
      admin,
      submissionId,
      user.id,
      uploadPath,
      processingToken,
      'uploading'
    );
    throw error;
  }
  const { error: uploadError } = await admin.storage
    .from('fan-art-staging')
    .upload(sanitizedPath, sanitized.data, {
      cacheControl: '0',
      contentType: 'image/webp',
      upsert: false,
    });

  if (uploadError) {
    await releaseProcessingClaim(
      admin,
      submissionId,
      user.id,
      uploadPath,
      processingToken,
      'uploading'
    );
    throw new Error('Fan art güvenli biçime kaydedilemedi');
  }

  const { data: pendingId, error: pendingError } = await admin.rpc(
    'mark_fan_art_pending',
    {
      p_submission_id: submissionId,
      p_user_id: user.id,
      p_upload_path: uploadPath,
      p_processing_token: processingToken,
      p_staging_path: sanitizedPath,
      p_size_bytes: sanitized.size,
      p_width: sanitized.width,
      p_height: sanitized.height,
    }
  );

  if (pendingError || !matchesFanArtId(pendingId, submissionId)) {
    await releaseProcessingClaim(
      admin,
      submissionId,
      user.id,
      uploadPath,
      processingToken,
      'uploading'
    );
    throw new Error('Fan art inceleme sırasına alınamadı');
  }

  return {
    id: submissionId,
    title: submission.title,
    status: 'pending',
    createdAt: submission.created_at,
    moderationReason: null,
  };
}

async function listPublicFanArtImpl(
  cursorValue?: FanArtCursor | null
): Promise<FanArtPublicPage> {
  const cursor = parseFanArtCursor(cursorValue);
  const admin = createAdminClient();
  let query = admin
    .from('fan_art_submissions')
    .select(
      'id, user_id, title, caption, alt_text, public_path, width, height, created_at, moderated_at'
    )
    .eq('status', 'approved');

  if (cursor) query = query.or(fanArtCursorFilter(cursor));

  const { data, error } = await query
    .order('moderated_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(FAN_ART_PAGE_SIZE + 1);

  if (error) throw new Error('Fan art galerisi yüklenemedi');
  const rows = data ?? [];
  const userIds = Array.from(new Set(rows.map((row) => row.user_id)));
  const profileMap = new Map<string, FanArtProfile>();

  if (userIds.length > 0) {
    const { data: profiles, error: profileError } = await admin
      .from('profiles')
      .select('id, display_name, first_name, last_name')
      .in('id', userIds);
    if (profileError) throw new Error('Fan art sanatçıları yüklenemedi');
    for (const profile of profiles ?? []) profileMap.set(profile.id, profile);
  }

  const items = rows.map((row) => {
    if (
      !row.public_path ||
      !row.width ||
      !row.height ||
      !row.moderated_at
    ) {
      throw new Error('Fan art kaydı eksik');
    }

    const imageUrl = admin.storage.from('fan-art').getPublicUrl(row.public_path).data
      .publicUrl;
    return {
      id: requireFanArtId(row.id),
      title: row.title,
      caption: row.caption,
      altText: row.alt_text,
      imageUrl,
      width: row.width,
      height: row.height,
      createdAt: row.created_at,
      artistName: artistName(profileMap.get(row.user_id)),
      moderatedAt: row.moderated_at,
    } satisfies FanArtPublicItem & { moderatedAt: string };
  });

  return toFanArtPage(items);
}

async function listMyFanArtSubmissionsImpl(
  cursorValue?: FanArtOwnCursor | null
): Promise<FanArtOwnPage> {
  const cursor = parseFanArtOwnCursor(cursorValue);
  const { admin, user } = await getFanArtContext({ allowBanned: true });
  let query = admin
    .from('fan_art_submissions')
    .select(
      'id, title, status, created_at, activity_at, rejection_reason, removal_reason'
    )
    .eq('user_id', user.id)
    .in('status', ['pending', 'approved', 'rejected', 'removed']);

  if (cursor) query = query.or(fanArtOwnCursorFilter(cursor));

  const { data, error } = await query
    .order('activity_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(FAN_ART_OWN_PAGE_SIZE + 1);

  if (error) throw new Error('Fan art gönderileriniz yüklenemedi');
  return toFanArtOwnPage(
    (data ?? []).map((row) => ({
      id: requireFanArtId(row.id),
      title: row.title,
      status: row.status as FanArtOwnStatus,
      createdAt: row.created_at,
      moderationReason:
        row.status === 'removed' ? row.removal_reason : row.rejection_reason,
      activityAt: row.activity_at,
    }))
  );
}

function fanArtActionError(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim()
    ? error.message
    : fallback;
}

async function fanArtResult<T>(
  operation: () => Promise<T>,
  fallback: string
): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await operation() };
  } catch (error) {
    return { ok: false, error: fanArtActionError(error, fallback) };
  }
}

export async function getFanArtViewerState(): Promise<
  ActionResult<{ isAuthenticated: boolean; isBanned: boolean }>
> {
  return fanArtResult(getFanArtViewerStateImpl, 'Fan art kullanıcı bilgisi yüklenemedi');
}

export async function createFanArtUploadTicket(
  request: FanArtUploadRequest
): Promise<
  ActionResult<{ submissionId: number; path: string; token: string }>
> {
  return fanArtResult(
    () => createFanArtUploadTicketImpl(request),
    'Fan art yükleme izni oluşturulamadı'
  );
}

export async function cancelFanArtUpload(
  submissionIdValue: number
): Promise<ActionResult<null>> {
  return fanArtResult(async () => {
    await cancelFanArtUploadImpl(submissionIdValue);
    return null;
  }, 'Yarım kalan fan art yüklemesi kapatılamadı');
}

export async function finalizeFanArtUpload(
  submissionIdValue: number
): Promise<ActionResult<FanArtOwnItem>> {
  return fanArtResult(
    () => finalizeFanArtUploadImpl(submissionIdValue),
    'Fan art inceleme sırasına alınamadı'
  );
}

export async function listPublicFanArt(
  cursorValue?: FanArtCursor | null
): Promise<ActionResult<FanArtPublicPage>> {
  return fanArtResult(
    () => listPublicFanArtImpl(cursorValue),
    'Fan art galerisi yüklenemedi'
  );
}

export async function listMyFanArtSubmissions(
  cursorValue?: FanArtOwnCursor | null
): Promise<
  ActionResult<FanArtOwnPage>
> {
  return fanArtResult(
    () => listMyFanArtSubmissionsImpl(cursorValue),
    'Fan art gönderileriniz yüklenemedi'
  );
}
