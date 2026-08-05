import 'server-only';

import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';

export type RateLimitAction = 'comment' | 'pano' | 'reaction' | 'avatar_upload' | 'contact';

const GUEST_COOKIE = 'author_blog_guest';
const RATE_LIMITS: Record<
  RateLimitAction,
  { limit: number; ipLimit: number; windowSeconds: number }
> = {
  comment: { limit: 5, ipLimit: 30, windowSeconds: 10 * 60 },
  pano: { limit: 5, ipLimit: 30, windowSeconds: 10 * 60 },
  reaction: { limit: 60, ipLimit: 300, windowSeconds: 60 },
  avatar_upload: { limit: 5, ipLimit: 30, windowSeconds: 60 * 60 },
  contact: { limit: 3, ipLimit: 20, windowSeconds: 60 * 60 },
};

type ActorFingerprint = {
  hash: string;
  scope: 'actor' | 'ip';
};

function getSecret(): string {
  const rateLimitSecret = process.env.RATE_LIMIT_SECRET?.trim();
  if (process.env.NODE_ENV === 'production' && !rateLimitSecret) {
    throw new Error('RATE_LIMIT_SECRET üretim ortamında zorunludur');
  }

  const secret = rateLimitSecret || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error('Rate limit sunucu anahtarı eksik');
  return secret;
}

function digest(value: string): string {
  return createHmac('sha256', getSecret()).update(value).digest('hex');
}

function signGuestId(id: string): string {
  return `${id}.${digest(`guest-cookie:${id}`)}`;
}

function verifyGuestCookie(value: string | undefined): string | null {
  if (!value) return null;
  const [id, signature] = value.split('.');
  if (!id || !signature || !/^[0-9a-f-]{36}$/i.test(id) || !/^[0-9a-f]{64}$/i.test(signature)) {
    return null;
  }

  const expected = digest(`guest-cookie:${id}`);
  const providedBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  if (providedBuffer.length !== expectedBuffer.length) return null;

  return timingSafeEqual(providedBuffer, expectedBuffer) ? id : null;
}

async function getGuestId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = verifyGuestCookie(cookieStore.get(GUEST_COOKIE)?.value);
  if (existing) return existing;

  const id = randomUUID();
  cookieStore.set(GUEST_COOKIE, signGuestId(id), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  return id;
}

async function getActorHashes(userId: string | null): Promise<ActorFingerprint[]> {
  const actor = userId ? `user:${userId}` : `guest:${await getGuestId()}`;
  const hashes: ActorFingerprint[] = [{ hash: digest(actor), scope: 'actor' }];

  const headerStore = await headers();
  const forwardedFor =
    headerStore.get('x-vercel-forwarded-for') ||
    headerStore.get('x-forwarded-for') ||
    headerStore.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0]?.trim().slice(0, 64);

  if (ip && ip.toLowerCase() !== 'unknown') {
    hashes.push({ hash: digest(`ip:${ip}`), scope: 'ip' });
  }

  return hashes;
}

export async function getPrimaryActorHash(userId: string | null): Promise<string> {
  return (await getActorHashes(userId))[0].hash;
}

export async function enforceRateLimit(action: RateLimitAction, userId: string | null) {
  const admin = createAdminClient();
  const config = RATE_LIMITS[action];
  const actorHashes = await getActorHashes(userId);

  for (const actor of actorHashes) {
    const { data, error } = await admin.rpc('consume_community_rate_limit', {
      p_actor_hash: actor.hash,
      p_action: action,
      p_limit: actor.scope === 'ip' ? config.ipLimit : config.limit,
      p_window_seconds: config.windowSeconds,
    });

    if (error) {
      throw new Error('İstek sınırı kontrol edilemedi');
    }

    if (data !== true) {
      throw new Error('Çok fazla istek gönderdiniz. Lütfen biraz bekleyip tekrar deneyin.');
    }
  }

  const retentionDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await admin.from('community_rate_limits').delete().lt('created_at', retentionDate);
}
