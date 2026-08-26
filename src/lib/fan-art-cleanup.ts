import 'server-only';

import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

export type FanArtBucket = 'fan-art-staging' | 'fan-art';

const CLEANUP_BATCH_SIZE = 25;
const CLEANUP_RETRY_MINUTES = 15;

export type FanArtCleanupResult = {
  scanned: number;
  claimed: number;
  removed: number;
  failed: number;
};

type CleanupJob = {
  id: number;
  bucket_id: FanArtBucket;
  object_path: string;
  attempts: number;
};

export async function enqueueFanArtCleanup(
  admin: SupabaseClient,
  bucket: FanArtBucket,
  objectPath: string,
  delayMinutes = CLEANUP_RETRY_MINUTES
): Promise<void> {
  const deleteAfter = new Date(Date.now() + delayMinutes * 60_000).toISOString();
  const { error } = await admin.from('fan_art_storage_cleanup_jobs').upsert(
    {
      bucket_id: bucket,
      object_path: objectPath,
      delete_after: deleteAfter,
      last_error: null,
    },
    { onConflict: 'bucket_id,object_path' }
  );

  if (error) throw new Error('Fan art dosya temizleme kaydı oluşturulamadı');
}

async function recordCleanupFailure(
  admin: SupabaseClient,
  job: CleanupJob,
  cleanupToken: string,
  message: string
) {
  await admin
    .from('fan_art_storage_cleanup_jobs')
    .update({
      attempts: job.attempts + 1,
      last_error: message.slice(0, 1000),
      delete_after: new Date(
        Date.now() + CLEANUP_RETRY_MINUTES * 60_000
      ).toISOString(),
      cleanup_started_at: null,
      cleanup_token: null,
    })
    .eq('id', job.id)
    .eq('cleanup_token', cleanupToken);
}

export async function cleanupDueFanArtObjects(
  admin: SupabaseClient
): Promise<FanArtCleanupResult> {
  const result: FanArtCleanupResult = {
    scanned: 0,
    claimed: 0,
    removed: 0,
    failed: 0,
  };
  const { data, error } = await admin
    .from('fan_art_storage_cleanup_jobs')
    .select('id, bucket_id, object_path, attempts')
    .lte('delete_after', new Date().toISOString())
    .order('delete_after', { ascending: true })
    .order('id', { ascending: true })
    .limit(CLEANUP_BATCH_SIZE);

  if (error) return { ...result, failed: 1 };
  if (!data?.length) return result;
  result.scanned = data.length;

  for (const rawJob of data) {
    const job = rawJob as CleanupJob;
    const cleanupToken = randomUUID();
    const { data: claimedId, error: claimError } = await admin.rpc(
      'claim_fan_art_storage_cleanup',
      {
        p_job_id: job.id,
        p_cleanup_token: cleanupToken,
      }
    );

    if (claimError) {
      result.failed += 1;
      continue;
    }
    if (Number(claimedId) !== job.id) continue;
    result.claimed += 1;

    const { error: removeError } = await admin.storage
      .from(job.bucket_id)
      .remove([job.object_path]);

    if (removeError) {
      result.failed += 1;
      await recordCleanupFailure(admin, job, cleanupToken, removeError.message);
      continue;
    }
    result.removed += 1;

    const { error: deleteJobError } = await admin
      .from('fan_art_storage_cleanup_jobs')
      .delete()
      .eq('id', job.id)
      .eq('cleanup_token', cleanupToken);
    if (deleteJobError) {
      result.failed += 1;
      await recordCleanupFailure(admin, job, cleanupToken, deleteJobError.message);
    }
  }

  return result;
}
