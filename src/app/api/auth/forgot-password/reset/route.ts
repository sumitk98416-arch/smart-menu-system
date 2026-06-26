import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { email, otp, token, newPassword } = await request.json();

    if (!email || !otp || !token || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    // ── Verify HMAC token ──────────────────────────────────────────
    const smtpPass = process.env.SMTP_PASS;
    const secret   = smtpPass || 'qrestro_otp_secret_fallback';

    const [expiryStr, hash] = token.split(':');
    const expiry = parseInt(expiryStr, 10);

    if (Date.now() > expiry) {
      return NextResponse.json(
        { success: false, error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    const dataToSign   = `${otp}:${expiry}:${email.toLowerCase().trim()}`;
    const expectedHash = crypto.createHmac('sha256', secret).update(dataToSign).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'))) {
      return NextResponse.json(
        { success: false, error: 'Invalid OTP. Please try again.' },
        { status: 400 }
      );
    }

    // ── Update password via Supabase Admin ────────────────────────
    const supabaseUrl         = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRole) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error.' },
        { status: 500 }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRole, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Find user by email
    const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers();
    if (listError) {
      return NextResponse.json(
        { success: false, error: 'Failed to locate account.' },
        { status: 500 }
      );
    }

    const user = usersData.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase().trim()
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No account found with that email address.' },
        { status: 404 }
      );
    }

    // Update password
    const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[forgot-password/reset]', error);
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
