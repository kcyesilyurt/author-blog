'use server';

import { revalidatePath } from 'next/cache';
import { getBootstrapAdminId, requireAdmin } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  createImageObjectName,
  getImageMimeFromObjectPath,
  validateImageMetadata,
  validateStoredImage,
} from '@/lib/image-upload';
import { COVER_IMAGE_MAX_BYTES } from '@/lib/upload-limits';
import {
  optionalText,
  parsePublicationInput,
  requireSlug,
  requireText,
  requireUuid,
} from '@/lib/validation';

function parseContentType(value: FormDataEntryValue | null): 'book' | 'post' {
  if (value !== 'book' && value !== 'post') throw new Error('İçerik türü geçersiz');
  return value;
}

function parseChapterOrder(value: FormDataEntryValue | null): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 10_000) {
    throw new Error('Bölüm sırası geçersiz');
  }
  return parsed;
}

function parseCoverUrl(value: FormDataEntryValue | null): string | null {
  const coverUrl = optionalText(value, 2048);
  if (!coverUrl) return null;
  if (coverUrl.startsWith('/') && !coverUrl.startsWith('//')) return coverUrl;

  try {
    const url = new URL(coverUrl);
    const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : null;
    const allowedHostname =
      url.hostname === supabaseHostname || url.hostname === 'images.unsplash.com';

    if (url.protocol !== 'https:' || !allowedHostname) throw new Error();
    return url.toString();
  } catch {
    throw new Error('Kapak adresi izin verilen bir HTTPS görseli olmalıdır');
  }
}

async function getBookPath(bookId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin.from('books').select('slug').eq('id', bookId).maybeSingle();
  return data?.slug ? `/books/${data.slug}` : null;
}

async function getChapterPublicPath(chapterId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data: chapter } = await admin
    .from('chapters')
    .select('slug, book_id')
    .eq('id', chapterId)
    .maybeSingle();
  if (!chapter) return null;

  const bookPath = await getBookPath(chapter.book_id);
  return bookPath ? `${bookPath}/${chapter.slug}` : null;
}

async function assertTargetCanBeManaged(actorId: string, targetIdValue: string) {
  const targetId = requireUuid(targetIdValue, 'Kullanıcı');
  if (actorId === targetId) throw new Error('Kendi yetki veya ban durumunuzu değiştiremezsiniz');

  if (targetId === getBootstrapAdminId()) {
    throw new Error('Birincil yönetici hesabı değiştirilemez');
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(targetId);
  if (error || !data.user) throw new Error('Kullanıcı bulunamadı');

  return targetId;
}

export async function createBook(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  const title = requireText(formData.get('title'), { fieldName: 'Başlık', min: 1, max: 160 });
  const slug = requireSlug(formData.get('slug'));
  const description = optionalText(formData.get('description'), 1000);
  const coverUrl = parseCoverUrl(formData.get('cover_url'));
  const type = parseContentType(formData.get('type'));
  const publication = parsePublicationInput(
    formData.get('status') ?? 'draft',
    formData.get('published_at')
  );

  const { error } = await admin.from('books').insert({
    title,
    slug,
    description,
    cover_url: coverUrl,
    type,
    status: publication.status,
    published_at: publication.publishedAt,
  });

  if (error) throw new Error(error.code === '23505' ? 'Bu URL adresi zaten kullanılıyor' : error.message);
  revalidatePath('/admin');
  revalidatePath('/');
}

export async function updateBook(idValue: string, formData: FormData) {
  await requireAdmin();
  const id = requireUuid(idValue, 'Eser');
  const admin = createAdminClient();
  const { data: existing, error: existingError } = await admin
    .from('books')
    .select('slug')
    .eq('id', id)
    .maybeSingle();
  if (existingError || !existing) throw new Error('Eser bulunamadı');

  const title = requireText(formData.get('title'), { fieldName: 'Başlık', min: 1, max: 160 });
  const slug = requireSlug(formData.get('slug'));
  const description = optionalText(formData.get('description'), 1000);
  const coverUrl = parseCoverUrl(formData.get('cover_url'));
  const type = parseContentType(formData.get('type'));
  const publication = parsePublicationInput(formData.get('status'), formData.get('published_at'));

  const { error } = await admin
    .from('books')
    .update({
      title,
      slug,
      description,
      cover_url: coverUrl,
      type,
      status: publication.status,
      published_at: publication.publishedAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw new Error(error.code === '23505' ? 'Bu URL adresi zaten kullanılıyor' : error.message);
  revalidatePath('/admin');
  revalidatePath('/');
  revalidatePath(`/books/${existing.slug}`);
  revalidatePath(`/books/${slug}`);
}

export async function deleteBook(idValue: string) {
  await requireAdmin();
  const id = requireUuid(idValue, 'Eser');
  const oldPath = await getBookPath(id);
  const admin = createAdminClient();
  const { error } = await admin.from('books').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin');
  revalidatePath('/');
  if (oldPath) revalidatePath(oldPath);
}

export async function createChapter(bookIdValue: string, formData: FormData) {
  await requireAdmin();
  const bookId = requireUuid(bookIdValue, 'Eser');
  const admin = createAdminClient();
  const title = requireText(formData.get('title'), { fieldName: 'Başlık', min: 1, max: 160 });
  const slug = requireSlug(formData.get('slug'));
  const chapterOrder = parseChapterOrder(formData.get('chapter_order'));

  const { data, error } = await admin
    .from('chapters')
    .insert({
      book_id: bookId,
      title,
      slug,
      chapter_order: chapterOrder,
      content: '',
      status: 'draft',
      published_at: null,
    })
    .select()
    .single();

  if (error) throw new Error(error.code === '23505' ? 'Bu bölüm URL adresi zaten kullanılıyor' : error.message);
  revalidatePath(`/admin/books/${bookId}`);
  return data;
}

export async function updateChapter(chapterIdValue: string, formData: FormData) {
  await requireAdmin();
  const chapterId = requireUuid(chapterIdValue, 'Bölüm');
  const admin = createAdminClient();
  const oldPublicPath = await getChapterPublicPath(chapterId);
  const { data: existing, error: existingError } = await admin
    .from('chapters')
    .select('book_id')
    .eq('id', chapterId)
    .maybeSingle();
  if (existingError || !existing) throw new Error('Bölüm bulunamadı');

  const title = requireText(formData.get('title'), { fieldName: 'Başlık', min: 1, max: 160 });
  const slug = requireSlug(formData.get('slug'));
  const content = optionalText(formData.get('content'), 500_000) ?? '';
  const chapterOrder = parseChapterOrder(formData.get('chapter_order'));
  const publication = parsePublicationInput(formData.get('status'), formData.get('published_at'));

  if (publication.status !== 'draft' && !content) {
    throw new Error('Boş bir bölüm yayınlanamaz');
  }

  const { error } = await admin
    .from('chapters')
    .update({
      title,
      slug,
      content,
      chapter_order: chapterOrder,
      status: publication.status,
      published_at: publication.publishedAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', chapterId);

  if (error) throw new Error(error.code === '23505' ? 'Bu bölüm URL adresi zaten kullanılıyor' : error.message);

  const bookPath = await getBookPath(existing.book_id);
  revalidatePath('/admin');
  revalidatePath(`/admin/books/${existing.book_id}`);
  revalidatePath('/');
  if (oldPublicPath) revalidatePath(oldPublicPath);
  if (bookPath) {
    revalidatePath(bookPath);
    revalidatePath(`${bookPath}/${slug}`);
  }
}

export async function deleteChapter(chapterIdValue: string, bookIdValue: string) {
  await requireAdmin();
  const chapterId = requireUuid(chapterIdValue, 'Bölüm');
  const bookId = requireUuid(bookIdValue, 'Eser');
  const oldPublicPath = await getChapterPublicPath(chapterId);
  const admin = createAdminClient();
  const { error } = await admin
    .from('chapters')
    .delete()
    .eq('id', chapterId)
    .eq('book_id', bookId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/books/${bookId}`);
  const bookPath = await getBookPath(bookId);
  if (bookPath) revalidatePath(bookPath);
  if (oldPublicPath) revalidatePath(oldPublicPath);
}

export async function createCoverUploadTicket(request: {
  mime: string;
  size: number;
}): Promise<{ path: string; token: string }> {
  await requireAdmin();
  const { extension } = validateImageMetadata(
    request?.mime,
    request?.size,
    COVER_IMAGE_MAX_BYTES
  );
  const admin = createAdminClient();
  const path = createImageObjectName(extension);
  const { data, error } = await admin.storage.from('covers').createSignedUploadUrl(path);

  if (error || !data?.token) throw new Error('Kapak yükleme izni oluşturulamadı');
  return { path, token: data.token };
}

export async function finalizeCoverUpload(pathValue: string): Promise<string> {
  await requireAdmin();
  const mime = getImageMimeFromObjectPath(pathValue);
  if (!mime) throw new Error('Kapak dosya yolu geçersiz');

  const admin = createAdminClient();
  const { data: file, error } = await admin.storage.from('covers').download(pathValue);
  if (error || !file) {
    await admin.storage.from('covers').remove([pathValue]);
    throw new Error('Yüklenen kapak okunamadı');
  }

  try {
    await validateStoredImage(file, mime, COVER_IMAGE_MAX_BYTES);
  } catch (validationError) {
    await admin.storage.from('covers').remove([pathValue]);
    throw validationError;
  }

  return admin.storage.from('covers').getPublicUrl(pathValue).data.publicUrl;
}

export async function listAdminProfiles() {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .select('id, display_name, first_name, last_name, avatar_url, is_banned, is_admin, created_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error('Kullanıcılar yüklenemedi');
  return data;
}

export async function deleteComment(commentIdValue: string) {
  await requireAdmin();
  const commentId = requireUuid(commentIdValue, 'Yorum');
  const admin = createAdminClient();
  const { data: comment } = await admin
    .from('comments')
    .select('chapter_id')
    .eq('id', commentId)
    .maybeSingle();
  const publicPath = comment ? await getChapterPublicPath(comment.chapter_id) : null;
  const { error } = await admin.from('comments').delete().eq('id', commentId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/comments');
  if (publicPath) revalidatePath(publicPath);
}

export async function banUser(userIdValue: string) {
  const actor = await requireAdmin();
  const userId = await assertTargetCanBeManaged(actor.id, userIdValue);
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .maybeSingle();
  if (profile?.is_admin) throw new Error('Önce kullanıcının yöneticilik yetkisini kaldırın');

  const { error } = await admin.from('profiles').update({ is_banned: true }).eq('id', userId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/users');
}

export async function unbanUser(userIdValue: string) {
  const actor = await requireAdmin();
  const userId = await assertTargetCanBeManaged(actor.id, userIdValue);
  const admin = createAdminClient();
  const { error } = await admin.from('profiles').update({ is_banned: false }).eq('id', userId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/users');
}

export async function toggleAdminRole(userIdValue: string) {
  const actor = await requireAdmin();
  const userId = await assertTargetCanBeManaged(actor.id, userIdValue);
  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('is_admin, is_banned')
    .eq('id', userId)
    .maybeSingle();
  if (profileError || !profile) throw new Error('Kullanıcı profili bulunamadı');
  if (profile.is_banned && !profile.is_admin) {
    throw new Error('Yasaklı bir kullanıcı yönetici yapılamaz');
  }

  if (profile.is_admin) {
    const { count } = await admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_admin', true);
    if ((count ?? 0) <= 1) throw new Error('Son yönetici hesabının yetkisi kaldırılamaz');
  }

  const { error } = await admin
    .from('profiles')
    .update({ is_admin: !profile.is_admin })
    .eq('id', userId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/users');
}

export async function deletePanoMessage(messageIdValue: string) {
  await requireAdmin();
  const messageId = requireUuid(messageIdValue, 'Pano mesajı');
  const admin = createAdminClient();
  const { error } = await admin.from('pano_messages').delete().eq('id', messageId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/comments');
  revalidatePath('/pano');
}
