import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, loginMode = 'passkey' } = body;

    const smtpUser = process.env.SMTP_USER || 'supportqrestro@gmail.com';
    const smtpPass = process.env.SMTP_PASS || '';

    // Validate email belongs to the administrator
    const cleanEmailInput = email ? email.trim().toLowerCase() : '';
    const cleanSmtpUser = smtpUser.trim().toLowerCase();

    if (cleanEmailInput !== cleanSmtpUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized administrator email.' },
        { status: 403 }
      );
    }

    if (loginMode === 'otp') {
      const { otp, token } = body;

      if (!otp || !token) {
        return NextResponse.json(
          { success: false, error: 'Missing verification code or token.' },
          { status: 400 }
        );
      }

      // Parse token: expiry:hash
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
          { success: false, error: 'The verification code has expired. Please request a new one.' },
          { status: 401 }
        );
      }

      // Re-sign data with submitted OTP and secret to verify authenticity
      const secret = smtpPass || 'dev_secret_fallback';
      const expectedData = `${otp.trim()}:${expiry}`;
      const computedHash = crypto.createHmac('sha256', secret).update(expectedData).digest('hex');

      if (tokenHash === computedHash) {
        return NextResponse.json({ success: true });
      }

      return NextResponse.json(
        { success: false, error: 'The verification code is incorrect. Please try again.' },
        { status: 401 }
      );
    } else {
      // Passkey mode
      const { passkey } = body;

      const cleanPasskeyInput = passkey ? passkey.replace(/\s+/g, '') : '';
      const cleanSmtpPass = smtpPass.replace(/\s+/g, '');

      if (cleanPasskeyInput === cleanSmtpPass) {
        return NextResponse.json({ success: true });
      }

      return NextResponse.json(
        { success: false, error: 'Invalid administrator email or passkey.' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Developer Auth Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
