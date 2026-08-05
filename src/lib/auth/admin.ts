import type { User } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type AdminContext = {
  user: User | null;
  isAdmin: boolean;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getBootstrapAdminId(): string | null {
  const value = process.env.ADMIN_USER_ID?.trim();
  if (!value) return null;
  if (!UUID_PATTERN.test(value)) {
    throw new Error('ADMIN_USER_ID geçerli bir kullanıcı UUID değeri olmalıdır');
  }
  return value.toLowerCase();
}

export async function getAdminContext(): Promise<AdminContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, isAdmin: false };
  }

  const bootstrapAdminId = getBootstrapAdminId();
  if (bootstrapAdminId === user.id) {
    const admin = createAdminClient();
    await admin
      .from('profiles')
      .update({ is_admin: true, is_banned: false })
      .eq('id', user.id);
    return { user, isAdmin: true };
  }

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from('profiles')
    .select('is_admin, is_banned')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !profile?.is_admin || profile.is_banned) {
    return { user, isAdmin: false };
  }

  return { user, isAdmin: true };
}

export async function requireAdmin(): Promise<User> {
  const { user, isAdmin } = await getAdminContext();

  if (!user || !isAdmin) {
    throw new Error('Yetkisiz erişim');
  }

  return user;
}
