import { cleanupDueFanArtObjects } from '@/lib/fan-art-cleanup';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_BATCHES_PER_RUN = 8;
const STOP_AFTER_MS = 45_000;

function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function GET(request: Request): Promise<Response> {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (
    !cronSecret ||
    request.headers.get('authorization') !== `Bearer ${cronSecret}`
  ) {
    return json({ ok: false }, 401);
  }

  try {
    const admin = createAdminClient();
    const totals = { scanned: 0, claimed: 0, removed: 0, failed: 0 };
    const startedAt = Date.now();

    for (let batch = 0; batch < MAX_BATCHES_PER_RUN; batch += 1) {
      const result = await cleanupDueFanArtObjects(admin);
      totals.scanned += result.scanned;
      totals.claimed += result.claimed;
      totals.removed += result.removed;
      totals.failed += result.failed;
      if (
        result.scanned === 0 ||
        result.claimed === 0 ||
        Date.now() - startedAt >= STOP_AFTER_MS
      ) {
        break;
      }
    }

    return json(
      { ok: totals.failed === 0, ...totals },
      totals.failed === 0 ? 200 : 500
    );
  } catch {
    return json({ ok: false }, 500);
  }
}
