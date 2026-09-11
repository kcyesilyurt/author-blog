'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { optionalUsername, requireText } from '@/lib/validation';
import type { ActionResult } from '@/lib/types';

type ProfileUpdateResult = ActionResult<{ username: string | null }>;

export async function updateProfile(formData: FormData): Promise<ProfileUpdateResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'Lütfen önce giriş yapın' };
  }

  let firstName: string;
  let lastName: string;
  let username: string | null | undefined = undefined;
  try {
    firstName = requireText(formData.get('first_name'), {
      fieldName: 'Ad',
      min: 1,
      max: 50,
    });
    lastName = requireText(formData.get('last_name'), {
      fieldName: 'Soyad',
      min: 1,
      max: 50,
    });
    if (formData.has('username')) {
      username = optionalUsername(formData.get('username'));
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Profil bilgileri geçersiz',
    };
  }

  const displayName = `${firstName} ${lastName}`.trim() || user.email || 'Okur';

  const admin = createAdminClient();
  const { data: currentProfile, error: currentProfileError } = await admin
    .from('profiles')
    .select('username, avatar_url, is_banned')
    .eq('id', user.id)
    .maybeSingle();

  if (currentProfileError || !currentProfile) {
    return { ok: false, error: 'Profil doğrulanamadı' };
  }
  if (currentProfile.is_banned) {
    return { ok: false, error: 'Askıya alınan hesaplar profilini değiştiremez' };
  }

  const nextUsername = username === undefined ? currentProfile.username : username;

  const { data: updatedProfile, error: profileError } = await admin
    .from('profiles')
    .update({
      first_name: firstName,
      last_name: lastName,
      display_name: displayName,
      username: nextUsername,
    })
    .eq('id', user.id)
    .eq('is_banned', false)
    .select('username')
    .maybeSingle();

  if (profileError?.code === '23505') {
    return { ok: false, error: 'Bu kullanıcı adı zaten alınmış' };
  }
  if (profileError) {
    return { ok: false, error: 'Profil güncellenemedi; lütfen tekrar deneyin' };
  }
  if (!updatedProfile) {
    return {
      ok: false,
      error: 'Profil durumu değişti; sayfayı yenileyip tekrar deneyin',
    };
  }

  await supabase.auth.updateUser({
    data: {
      first_name: firstName,
      last_name: lastName,
      display_name: displayName,
      avatar_url: currentProfile.avatar_url || null,
    },
  });

  revalidatePath('/');
  revalidatePath('/profile');
  revalidatePath('/pano');
  revalidatePath('/admin/comments');

  return { ok: true, data: { username: updatedProfile.username } };
}
