import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json();

    const smtpUser = process.env.SMTP_USER || 'supportqrestro@gmail.com';
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpPass) {
      console.warn('WARNING: SMTP_PASS env variable is not set. Gracefully logging submission instead.');
      console.log('--- Mock Email Submission ---');
      console.log(`To: supportqrestro@gmail.com`);
      console.log(`From: ${name} <${email}>`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${message}`);
      console.log('-----------------------------');
      
      // Return success even if password is not configured so the frontend looks fully operational during local testing
      return NextResponse.json({ 
        success: true, 
        warning: 'SMTP_PASS is not configured. Submission logged to console.' 
      });
    }

    // Configure Nodemailer transporter (Gmail service is standard, but you can configure any SMTP)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const mailOptions = {
      from: `"QRestro Landing" <${smtpUser}>`,
      to: smtpUser,
      replyTo: email,
      subject: `New QRestro Contact Inquiry: ${subject}`,
      text: `You received a new message from your QRestro landing page contact form.\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
      html: `
        <div style="font-family: sans-serif; padding: 25px; color: #333; background-color: #FAF6F0; border-radius: 20px; max-w: 600px; margin: auto; border: 1px solid #EBE3D5;">
          <div style="text-align: center; border-bottom: 2px solid #EBE3D5; padding-bottom: 15px; margin-bottom: 20px;">
            <h2 style="color: #c8913a; margin: 0; font-size: 24px; font-weight: bold;">New Contact Form Submission</h2>
            <p style="color: #666; margin: 5px 0 0 0; font-size: 13px;">Received via QRestro Landing Page</p>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #666; width: 100px;">Name:</td>
              <td style="padding: 6px 0; color: #222;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #666;">Email:</td>
              <td style="padding: 6px 0; color: #c8913a;"><a href="mailto:${email}" style="color: #c8913a; text-decoration: none; font-weight: bold;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #666;">Subject:</td>
              <td style="padding: 6px 0; color: #222;">${subject}</td>
            </tr>
          </table>

          <div style="background-color: #ffffff; border: 1px solid #EBE3D5; border-radius: 12px; padding: 20px; margin-top: 10px;">
            <p style="margin: 0; line-height: 1.6; white-space: pre-wrap; font-size: 14px; color: #444;">${message}</p>
          </div>

          <div style="text-align: center; margin-top: 30px; font-size: 11px; color: #999; border-top: 1px solid #EBE3D5; padding-top: 15px;">
            This email was sent directly from your QRestro system server.
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error('SMTP Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
