'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { enforceRateLimit } from '@/lib/rate-limit';
import {
  createImageObjectName,
  getImageMimeFromObjectPath,
  getOwnedPublicObjectPath,
  validateImageMetadata,
  validateStoredImage,
} from '@/lib/image-upload';
import { AVATAR_IMAGE_MAX_BYTES } from '@/lib/upload-limits';

async function getActiveAvatarContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Profil fotoğrafı yüklemek için giriş yapın');

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('avatar_url, is_banned')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile) throw new Error('Profil doğrulanamadı');
  if (profile.is_banned) throw new Error('Askıya alınan hesaplar görsel yükleyemez');

  return { supabase, user, admin, profile };
}

export async function createAvatarUploadTicket(request: {
  mime: string;
  size: number;
}): Promise<{ path: string; token: string }> {
  const { user, admin } = await getActiveAvatarContext();

  await enforceRateLimit('avatar_upload', user.id);
  const { extension } = validateImageMetadata(
    request?.mime,
    request?.size,
    AVATAR_IMAGE_MAX_BYTES
  );
  const path = `${user.id}/${createImageObjectName(extension)}`;
  const { data, error } = await admin.storage.from('avatars').createSignedUploadUrl(path);

  if (error || !data?.token) throw new Error('Profil fotoğrafı yükleme izni oluşturulamadı');
  return { path, token: data.token };
}

export async function finalizePublicAvatar(pathValue: string): Promise<string> {
  const { supabase, user, admin, profile } = await getActiveAvatarContext();
  const mime = getImageMimeFromObjectPath(pathValue, user.id);
  if (!mime) throw new Error('Profil fotoğrafı dosya yolu geçersiz');

  const { data: file, error } = await admin.storage.from('avatars').download(pathValue);
  if (error || !file) {
    await admin.storage.from('avatars').remove([pathValue]);
    throw new Error('Yüklenen profil fotoğrafı okunamadı');
  }

  try {
    await validateStoredImage(file, mime, AVATAR_IMAGE_MAX_BYTES);
  } catch (validationError) {
    await admin.storage.from('avatars').remove([pathValue]);
    throw validationError;
  }

  const { data } = admin.storage.from('avatars').getPublicUrl(pathValue);
  const avatarUrl = data.publicUrl;

  const { error: updateError } = await admin
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id);

  if (updateError) {
    await admin.storage.from('avatars').remove([pathValue]);
    throw new Error('Profil fotoğrafı kaydedilemedi');
  }

  await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } });

  const previousObjectPath = getOwnedPublicObjectPath(profile.avatar_url, 'avatars', user.id);
  if (previousObjectPath && previousObjectPath !== pathValue) {
    await admin.storage.from('avatars').remove([previousObjectPath]);
  }

  revalidatePath('/profile');
  revalidatePath('/pano');
  return avatarUrl;
}
