import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { otp, token } = await request.json();

    if (!otp || !token) {
      return NextResponse.json(
        { success: false, error: 'Missing code or verification token.' },
        { status: 400 }
      );
    }

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

    if (tokenHash === computedHash) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: 'The verification code is incorrect.' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Verify OTP Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error verifying code.' },
      { status: 500 }
    );
  }
}
