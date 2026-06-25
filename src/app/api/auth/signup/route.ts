import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { name, email, password, phone, otp, token } = await request.json();

    if (!name || !email || !password || !otp || !token) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Verify OTP first
    const tokenParts = token.split(':');
    if (tokenParts.length !== 2) {
      return NextResponse.json(
        { success: false, error: 'Invalid verification token format.' },
        { status: 400 }
      );
    }

    const [expiryStr, tokenHash] = tokenParts;
    const expiry = parseInt(expiryStr, 10);

    // Verify expiration
    if (Date.now() > expiry) {
      return NextResponse.json(
        { success: false, error: 'The verification code has expired. Please try again.' },
        { status: 401 }
      );
    }

    // Recompute hash
    const smtpPass = process.env.SMTP_PASS;
    const cleanSmtpPass = smtpPass ? smtpPass.replace(/\s+/g, '') : '';
    const secret = cleanSmtpPass || 'signup_secret_fallback';
    const expectedData = `${otp.trim()}:${expiry}`;
    const computedHash = crypto.createHmac('sha256', secret).update(expectedData).digest('hex');

    if (tokenHash !== computedHash) {
      return NextResponse.json(
        { success: false, error: 'The verification code is incorrect.' },
        { status: 401 }
      );
    }

    // 2. Create user as verified using the Supabase Service Role Key (Admin)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Supabase URL or Service Role Key is missing on the server.' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      phone: phone ? phone.trim() : undefined,
      phone_confirm: phone ? true : undefined,
      user_metadata: { full_name: name },
    });

    if (createError) {
      console.error('Supabase User Creation Error:', createError);
      return NextResponse.json(
        { success: false, error: createError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (error) {
    console.error('API Signup Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during signup.' },
      { status: 500 }
    );
  }
}
