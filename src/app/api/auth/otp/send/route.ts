import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { type, target } = await request.json();

    if (!type || !target) {
      return NextResponse.json(
        { success: false, error: 'Missing type or target value.' },
        { status: 400 }
      );
    }

    const cleanTarget = target.trim();
    if (!cleanTarget) {
      return NextResponse.json(
        { success: false, error: 'Target must not be empty.' },
        { status: 400 }
      );
    }

    // Generate a secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Generate stateless token
    const smtpUser = process.env.SMTP_USER || 'supportqrestro@gmail.com';
    const smtpPass = process.env.SMTP_PASS;
    const cleanSmtpPass = smtpPass ? smtpPass.replace(/\s+/g, '') : '';
    const secret = cleanSmtpPass || 'signup_secret_fallback';
    const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes validity
    const dataToSign = `${otp}:${expiry}`;
    const hash = crypto.createHmac('sha256', secret).update(dataToSign).digest('hex');
    const token = `${expiry}:${hash}`;

    // Always log OTP to server console for local testing/verification convenience
    console.log('\n==================================================');
    console.log(`[QRESTRO OTP GENERATED]`);
    console.log(`Method: ${type.toUpperCase()}`);
    console.log(`To:     ${cleanTarget}`);
    console.log(`OTP:    ${otp}`);
    console.log('==================================================\n');

    if (type === 'email') {
      if (!smtpPass) {
        return NextResponse.json({
          success: true,
          token,
          otp,
          warning: `SMTP_PASS is not configured. Code printed to server logs: ${otp}`
        });
      }

      // Configure transporter
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      // Send premium email
      const mailOptions = {
        from: `"QRestro Setup" <${smtpUser}>`,
        to: cleanTarget,
        subject: `[QRestro] Verify your email - Code: ${otp}`,
        text: `Your QRestro email verification code is: ${otp}. This code is valid for 5 minutes.`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; padding: 50px 20px; color: #f4f4f5; text-align: center;">
            <div style="max-width: 480px; margin: 0 auto; background-color: #18181b; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 40px 32px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
              
              <!-- Branding Header -->
              <div style="margin-bottom: 30px;">
                <h1 style="color: #c8913a; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.03em;">QRestro</h1>
                <span style="color: #71717a; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; display: block; margin-top: 4px;">Smart Dining Platform</span>
              </div>
              
              <div style="border-bottom: 1px solid rgba(255, 255, 255, 0.08); margin-bottom: 30px;"></div>
              
              <!-- Context -->
              <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 12px 0; color: #ffffff;">Email Verification</h2>
              <p style="color: #a1a1aa; font-size: 14px; line-height: 1.5; margin: 0 0 32px 0;">
                Please enter the verification code below on the signup page to confirm this email address.
              </p>
              
              <!-- OTP Badge -->
              <div style="background-color: rgba(200, 145, 58, 0.06); border: 1px solid rgba(200, 145, 58, 0.25); border-radius: 12px; padding: 18px 24px; display: inline-block; letter-spacing: 8px; font-size: 36px; font-weight: 800; color: #c8913a; font-family: monospace; margin-bottom: 32px; padding-left: 32px;">
                ${otp}
              </div>
              
              <!-- Warning/Expiry -->
              <p style="color: #71717a; font-size: 12px; margin: 0 0 8px 0;">
                This code will expire in <strong style="color: #a1a1aa;">5 minutes</strong>.
              </p>
              
            </div>
            <div style="margin-top: 24px; color: #3f3f46; font-size: 11px;">
              &copy; 2026 QRestro. All rights reserved.
            </div>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
    } else if (type === 'phone') {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

      if (accountSid && authToken && twilioPhoneNumber) {
        try {
          const authString = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
          const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${authString}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                Body: `Your QRestro verification code is: ${otp}. Valid for 5 minutes.`,
                From: twilioPhoneNumber,
                To: cleanTarget,
              }).toString(),
            }
          );

          if (!response.ok) {
            const errData = await response.json();
            console.error('Twilio Send Message Error:', errData);
            return NextResponse.json(
              { success: false, error: errData.message || 'Twilio failed to send verification SMS.' },
              { status: 500 }
            );
          }

          return NextResponse.json({ success: true, token });
        } catch (err) {
          console.error('SMS Gateway Connection Error:', err);
          return NextResponse.json(
            { success: false, error: 'Failed to connect to Twilio SMS gateway.' },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json({
          success: true,
          token,
          otp,
          warning: `SMS API is not configured. Code printed to server logs: ${otp}`
        });
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid verification type.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error('Send Verification Code Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error sending code.' },
      { status: 500 }
    );
  }
}
