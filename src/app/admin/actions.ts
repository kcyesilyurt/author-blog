'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    throw new Error('Unauthorized');
  }
}

export async function createBook(formData: FormData) {
  await assertAdmin();
  const admin = createAdminClient();
  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;
  const description = formData.get('description') as string;
  const coverUrl = formData.get('cover_url') as string;
  const type = formData.get('type') as string;

  const { error } = await admin.from('books').insert({
    title,
    slug,
    description: description || null,
    cover_url: coverUrl || null,
    type: type || 'book',
  });

  if (error) throw new Error(error.message);
  revalidatePath('/admin');
  revalidatePath('/');
}

export async function updateBook(id: string, formData: FormData) {
  await assertAdmin();
  const admin = createAdminClient();
  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;
  const description = formData.get('description') as string;
  const coverUrl = formData.get('cover_url') as string;
  const type = formData.get('type') as string;

  const { error } = await admin.from('books').update({
    title,
    slug,
    description: description || null,
    cover_url: coverUrl || null,
    type: type || 'book',
    updated_at: new Date().toISOString(),
  }).eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/admin');
  revalidatePath('/');
}

export async function deleteBook(id: string) {
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from('books').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin');
  revalidatePath('/');
}

export async function createChapter(bookId: string, formData: FormData) {
  await assertAdmin();
  const admin = createAdminClient();
  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;
  const chapterOrder = parseInt(formData.get('chapter_order') as string) || 0;

  const { data, error } = await admin.from('chapters').insert({
    book_id: bookId,
    title,
    slug,
    chapter_order: chapterOrder,
    content: '',
  }).select().single();

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/books/${bookId}`);
  return data;
}

export async function updateChapter(chapterId: string, formData: FormData) {
  await assertAdmin();
  const admin = createAdminClient();
  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;
  const content = formData.get('content') as string;
  const chapterOrder = parseInt(formData.get('chapter_order') as string) || 0;

  const { error } = await admin.from('chapters').update({
    title,
    slug,
    content,
    chapter_order: chapterOrder,
    updated_at: new Date().toISOString(),
  }).eq('id', chapterId);

  if (error) throw new Error(error.message);
  revalidatePath('/admin');
}

export async function deleteChapter(chapterId: string, bookId: string) {
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from('chapters').delete().eq('id', chapterId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/books/${bookId}`);
}

export async function uploadCoverImage(formData: FormData): Promise<string> {
  await assertAdmin();
  const admin = createAdminClient();
  const file = formData.get('file') as File;
  const fileName = `${Date.now()}-${file.name}`;

  const { error } = await admin.storage.from('covers').upload(fileName, file);
  if (error) throw new Error(error.message);

  const { data } = admin.storage.from('covers').getPublicUrl(fileName);
  return data.publicUrl;
}
