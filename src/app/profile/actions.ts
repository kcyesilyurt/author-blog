'use server';

import { createClient } from '@/lib/supabase/server';

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');

  const displayName = formData.get('display_name') as string;
  const instagramUsername = formData.get('instagram_username') as string;

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName,
      instagram_username: instagramUsername || null,
    })
    .eq('id', user.id);

  if (error) throw new Error(error.message);
}
