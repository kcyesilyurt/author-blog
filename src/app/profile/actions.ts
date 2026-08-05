'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { requireText } from '@/lib/validation';

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Lütfen önce giriş yapın');
  }

  const firstName = requireText(formData.get('first_name'), {
    fieldName: 'Ad',
    min: 1,
    max: 50,
  });
  const lastName = requireText(formData.get('last_name'), {
    fieldName: 'Soyad',
    min: 1,
    max: 50,
  });

  const displayName = `${firstName} ${lastName}`.trim() || user.email || 'Okur';

  const admin = createAdminClient();
  const { data: currentProfile, error: currentProfileError } = await admin
    .from('profiles')
    .select('avatar_url, is_banned')
    .eq('id', user.id)
    .maybeSingle();

  if (currentProfileError || !currentProfile) {
    throw new Error('Profil doğrulanamadı');
  }
  if (currentProfile.is_banned) {
    throw new Error('Askıya alınan hesaplar profilini değiştiremez');
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({
      first_name: firstName,
      last_name: lastName,
      display_name: displayName,
    })
    .eq('id', user.id);

  if (profileError) throw new Error(profileError.message);

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
}
