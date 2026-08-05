'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { enforceRateLimit } from '@/lib/rate-limit';
import {
  assertReasonableLinkCount,
  requireEmail,
  requireText,
} from '@/lib/validation';

export type ContactMessagePayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
  website?: string;
};

export type ContactMessageResult = {
  ok: boolean;
  message: string;
};

export async function submitContactMessage(
  payload: ContactMessagePayload
): Promise<ContactMessageResult> {
  const successMessage = 'Mesajın ulaştı. En kısa sürede dönüş yapılacak.';

  // A hidden field that real visitors never fill. Returning the normal success
  // response avoids teaching automated senders how the trap works.
  if (typeof payload?.website === 'string' && payload.website.trim()) {
    return { ok: true, message: successMessage };
  }

  let name: string;
  let email: string;
  let subject: string;
  let message: string;

  try {
    name = requireText(payload?.name, {
      fieldName: 'İsim soyisim',
      min: 2,
      max: 80,
    });
    email = requireEmail(payload?.email);
    subject = requireText(payload?.subject, {
      fieldName: 'Konu',
      min: 3,
      max: 160,
    });
    message = requireText(payload?.message, {
      fieldName: 'Mesaj',
      min: 10,
      max: 5000,
    });
    assertReasonableLinkCount(message, 3);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Form alanlarını kontrol edin.',
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    await enforceRateLimit('contact', user?.id ?? null);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    return {
      ok: false,
      message: message.startsWith('Çok fazla istek')
        ? message
        : 'Mesaj şu anda gönderilemedi. Lütfen daha sonra tekrar dene.',
    };
  }

  const admin = createAdminClient();
  const { error } = await admin.from('contact_messages').insert({
    user_id: user?.id ?? null,
    name,
    email,
    subject,
    message,
  });

  if (error) {
    console.error('Contact message could not be stored:', error.code);
    return {
      ok: false,
      message: 'Mesaj şu anda gönderilemedi. Lütfen daha sonra tekrar dene.',
    };
  }

  revalidatePath('/admin/messages');
  return { ok: true, message: successMessage };
}
