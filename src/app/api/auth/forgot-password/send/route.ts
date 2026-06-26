import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required.' },
        { status: 400 }
      );
    }

    const smtpUser = process.env.SMTP_USER || 'supportqrestro@gmail.com';
    const smtpPass = process.env.SMTP_PASS;
    const secret   = smtpPass || 'qrestro_otp_secret_fallback';

    // Generate a secure 6-digit OTP
    const otp    = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    // HMAC-sign: otp + expiry + target email (so token is email-bound)
    const dataToSign = `${otp}:${expiry}:${email.toLowerCase().trim()}`;
    const hash  = crypto.createHmac('sha256', secret).update(dataToSign).digest('hex');
    const token = `${expiry}:${hash}`;

    // ── Dev mode: no SMTP configured ──────────────────────────────
    if (!smtpPass) {
      console.log('\n─── [FORGOT PASSWORD OTP] ───────────────');
      console.log(`  To:  ${email}`);
      console.log(`  OTP: ${otp}`);
      console.log('─────────────────────────────────────────\n');
      return NextResponse.json({
        success: true,
        token,
        warning: 'SMTP_PASS not configured. OTP printed to server logs.',
      });
    }

    // ── Send email ─────────────────────────────────────────────────
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: `"QRestro Support" <${smtpUser}>`,
      to: email,
      subject: `${otp} — Your QRestro Password Reset Code`,
      text: `Your QRestro password reset code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, you can safely ignore this email.`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#09090b;padding:50px 20px;color:#f4f4f5;text-align:center;">
          <div style="max-width:480px;margin:0 auto;background:#18181b;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px 32px;box-shadow:0 10px 25px -5px rgba(0,0,0,0.5);">

            <div style="margin-bottom:28px;">
              <h1 style="color:#c8913a;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.03em;">QRestro</h1>
              <span style="color:#71717a;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;display:block;margin-top:4px;">Password Reset</span>
            </div>

            <div style="border-bottom:1px solid rgba(255,255,255,0.07);margin-bottom:28px;"></div>

            <h2 style="font-size:18px;font-weight:600;margin:0 0 10px 0;color:#ffffff;">Your Reset Code</h2>
            <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 30px 0;">
              Use the code below to reset your password.<br/>It is valid for <strong style="color:#e4e4e7;">10 minutes</strong>.
            </p>

            <div style="background:rgba(200,145,58,0.07);border:1px solid rgba(200,145,58,0.28);border-radius:12px;padding:20px 28px;display:inline-block;letter-spacing:10px;font-size:38px;font-weight:800;color:#c8913a;font-family:'Courier New',Courier,monospace;margin-bottom:30px;padding-left:38px;">
              ${otp}
            </div>

            <p style="color:#71717a;font-size:12px;margin:0 0 6px 0;">
              Didn&rsquo;t request a password reset? You can safely ignore this email.
            </p>

          </div>
          <div style="margin-top:22px;color:#3f3f46;font-size:11px;">
            &copy; ${new Date().getFullYear()} QRestro &mdash; supportqrestro@gmail.com
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error('[forgot-password/send]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send OTP. Please try again.' },
      { status: 500 }
    );
  }
}
