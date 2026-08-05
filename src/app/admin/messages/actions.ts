'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ContactMessage } from '@/lib/types';
import { requireUuid } from '@/lib/validation';

function requireReadState(value: unknown): boolean {
  if (typeof value !== 'boolean') throw new Error('Okunma durumu geçersiz');
  return value;
}

export async function listContactMessages(): Promise<ContactMessage[]> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('contact_messages')
    .select('id, user_id, name, email, subject, message, created_at, read_at')
    .order('created_at', { ascending: false });

  if (error) throw new Error('Mesajlar yüklenemedi');
  return (data ?? []) as ContactMessage[];
}

export async function setContactMessageRead(
  messageIdValue: string,
  readValue: boolean
): Promise<void> {
  await requireAdmin();
  const messageId = requireUuid(messageIdValue, 'Mesaj');
  const isRead = requireReadState(readValue);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('contact_messages')
    .update({ read_at: isRead ? new Date().toISOString() : null })
    .eq('id', messageId)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('Contact message update failed:', error.code);
    throw new Error('Mesaj durumu güncellenemedi');
  }
  if (!data) throw new Error('Mesaj bulunamadı');
  revalidatePath('/admin/messages');
}

export async function deleteContactMessage(messageIdValue: string): Promise<void> {
  await requireAdmin();
  const messageId = requireUuid(messageIdValue, 'Mesaj');
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('contact_messages')
    .delete()
    .eq('id', messageId)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('Contact message delete failed:', error.code);
    throw new Error('Mesaj silinemedi');
  }
  if (!data) throw new Error('Mesaj bulunamadı');
  revalidatePath('/admin/messages');
}
