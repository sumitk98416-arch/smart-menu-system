import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    const smtpUser = process.env.SMTP_USER || 'supportqrestro@gmail.com';
    const smtpPass = process.env.SMTP_PASS;

    // Validate email belongs to the administrator
    const cleanEmailInput = email ? email.trim().toLowerCase() : '';
    const cleanSmtpUser = smtpUser.trim().toLowerCase();

    if (cleanEmailInput !== cleanSmtpUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized administrator email.' },
        { status: 403 }
      );
    }

    // Generate a secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Generate the token: expiry timestamp + signature
    const secret = smtpPass || 'dev_secret_fallback';
    const expiry = Date.now() + 5 * 60 * 1000; // Valid for 5 minutes
    const dataToSign = `${otp}:${expiry}`;
    const hash = crypto.createHmac('sha256', secret).update(dataToSign).digest('hex');
    const token = `${expiry}:${hash}`;

    // Handle mock logs when SMTP is not configured
    if (!smtpPass) {
      console.log('\n--- [DEVELOPER OTP SUBMISSION] ---');
      console.log(`To: ${cleanSmtpUser}`);
      console.log(`Generated OTP: ${otp}`);
      console.log('---------------------------------\n');

      return NextResponse.json({
        success: true,
        token,
        warning: 'SMTP_PASS is not configured. OTP printed to server logs.'
      });
    }

    // Configure Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // Premium dark-themed email template
    const mailOptions = {
      from: `"QRestro Developer Console" <${smtpUser}>`,
      to: cleanSmtpUser,
      subject: `[QRestro] OTP: ${otp} - Developer Verification Code`,
      text: `Your QRestro Developer Verification Code is: ${otp}. This code is valid for 5 minutes.`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; padding: 50px 20px; color: #f4f4f5; text-align: center;">
          <div style="max-width: 480px; margin: 0 auto; background-color: #18181b; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 40px 32px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
            
            <!-- Branding Header -->
            <div style="margin-bottom: 30px;">
              <h1 style="color: #c8913a; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.03em; font-family: system-ui, -apple-system, sans-serif;">QRestro</h1>
              <span style="color: #71717a; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; display: block; margin-top: 4px;">Developer Command Center</span>
            </div>
            
            <div style="border-bottom: 1px solid rgba(255, 255, 255, 0.08); margin-bottom: 30px;"></div>
            
            <!-- Context Statement -->
            <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 12px 0; color: #ffffff; letter-spacing: -0.01em;">Verification Code</h2>
            <p style="color: #a1a1aa; font-size: 14px; line-height: 1.5; margin: 0 0 32px 0;">
              Enter the single-use code below on the verification screen to authenticate into your administrator account.
            </p>
            
            <!-- OTP Badge -->
            <div style="background-color: rgba(200, 145, 58, 0.06); border: 1px solid rgba(200, 145, 58, 0.25); border-radius: 12px; padding: 18px 24px; display: inline-block; letter-spacing: 8px; font-size: 36px; font-weight: 800; color: #c8913a; font-family: 'Courier New', Courier, monospace; margin-bottom: 32px; padding-left: 32px;">
              ${otp}
            </div>
            
            <!-- Additional Details -->
            <p style="color: #71717a; font-size: 12px; line-height: 1.4; margin: 0 0 8px 0;">
              This code will expire in <strong style="color: #a1a1aa;">5 minutes</strong>.
            </p>
            <p style="color: #71717a; font-size: 11px; line-height: 1.4; margin: 0;">
              Did not request this code? You can safely ignore this email.
            </p>
            
          </div>
          
          <div style="margin-top: 24px; color: #3f3f46; font-size: 11px;">
            &copy; 2026 QRestro. All rights reserved.
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error('Send OTP Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while sending OTP.' },
      { status: 500 }
    );
  }
}
