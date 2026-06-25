import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`);
      response.cookies.set('qrestro_demo', '', { path: '/', maxAge: 0 });
      response.cookies.set('qrestro_demo_name', '', { path: '/', maxAge: 0 });
      response.cookies.set('qrestro_demo_email', '', { path: '/', maxAge: 0 });
      response.cookies.set('qrestro_demo_phone', '', { path: '/', maxAge: 0 });
      response.cookies.set('qrestro_demo_password', '', { path: '/', maxAge: 0 });
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
