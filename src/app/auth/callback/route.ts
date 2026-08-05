import { NextResponse } from 'next/server';
import { getSafeInternalPath } from '@/lib/auth-redirect';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;
  const code = searchParams.get('code');
  const next = getSafeInternalPath(searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl));
    }
  }

  const loginUrl = new URL('/auth/login', requestUrl);
  loginUrl.searchParams.set('error', 'callback');
  return NextResponse.redirect(loginUrl);
}
