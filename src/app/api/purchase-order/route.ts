import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { 
      toEmail, 
      restaurantName, 
      restaurantEmail, 
      supplierName,
      poId, 
      itemName, 
      quantity, 
      unit, 
      notes,
      orders, // Optional array of purchase orders
      orderDate 
    } = await request.json();

    const smtpUser = process.env.SMTP_USER || 'supportqrestro@gmail.com';
    const smtpPass = process.env.SMTP_PASS;

    let itemsText = '';
    let itemsHtml = '';

    if (orders && Array.isArray(orders)) {
      itemsText = orders.map((o, idx) => `${idx + 1}. ${o.itemName} - ${o.quantity} ${o.unit} ${o.notes ? `(Note: ${o.notes})` : ''}`).join('\n');
      itemsHtml = orders.map(o => `
        <tr style="border-bottom: 1px solid #FAF6F0; font-size: 13px;">
          <td style="padding: 10px 0; color: #2C261F; font-weight: bold;">${o.itemName}</td>
          <td style="padding: 10px 0; text-align: right; color: #2C261F; font-weight: bold; font-size: 13px; white-space: nowrap; padding-right: 15px;">${o.quantity} ${o.unit}</td>
          <td style="padding: 10px 0; color: #5A5348; font-size: 12px; font-style: italic; font-weight: normal;">${o.notes || '—'}</td>
        </tr>
      `).join('');
    } else {
      itemsText = `${itemName} - ${quantity} ${unit} ${notes ? `(Note: ${notes})` : ''}`;
      itemsHtml = `
        <tr style="border-bottom: 1px solid #FAF6F0; font-size: 13px;">
          <td style="padding: 10px 0; color: #2C261F; font-weight: bold;">${itemName}</td>
          <td style="padding: 10px 0; text-align: right; color: #2C261F; font-weight: bold; font-size: 13px; white-space: nowrap; padding-right: 15px;">${quantity} ${unit}</td>
          <td style="padding: 10px 0; color: #5A5348; font-size: 12px; font-style: italic; font-weight: normal;">${notes || '—'}</td>
        </tr>
      `;
    }

    const referenceId = poId ? poId.toUpperCase().slice(0, 8) : `BATCH-${Date.now().toString().slice(-4)}`;

    if (!smtpPass) {
      console.warn('WARNING: SMTP_PASS env variable is not set. Logging purchase order to console.');
      console.log('--- Mock Purchase Order Email ---');
      console.log(`To: ${toEmail}`);
      console.log(`From: "${restaurantName}" <${smtpUser}>`);
      console.log(`Supplier: ${supplierName || 'Various'}`);
      console.log(`PO ID Ref: ${referenceId}`);
      console.log(`Items:\n${itemsText}`);
      console.log('---------------------------------');
      return NextResponse.json({ 
        success: true, 
        warning: 'SMTP_PASS is not configured. Email logged to console.' 
      });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const mailOptions = {
      from: `"${restaurantName}" <${smtpUser}>`,
      to: toEmail,
      replyTo: restaurantEmail,
      subject: `[Purchase Order] ${restaurantName} - Supplier: ${supplierName || 'Various'} (Ref: ${referenceId})`,
      text: `Dear Supplier,\n\nPlease find the following purchase order items from ${restaurantName}:\n\nOrder Date: ${orderDate}\n\nItems:\n${itemsText}\n\nBest regards,\n${restaurantName}`,
      html: `
        <div style="font-family: sans-serif; padding: 25px; color: #333; background-color: #FAF6F0; border-radius: 20px; max-width: 600px; margin: auto; border: 1px solid #EBE3D5;">
          <div style="text-align: center; border-bottom: 2px solid #EBE3D5; padding-bottom: 15px; margin-bottom: 20px;">
            <h2 style="color: #B88A52; margin: 0; font-size: 24px; font-weight: bold;">PURCHASE ORDER</h2>
            <p style="color: #666; margin: 5px 0 0 0; font-size: 13px;">Issued by ${restaurantName}</p>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #666; width: 150px;">PO Ref ID:</td>
              <td style="padding: 6px 0; color: #222; font-family: monospace; font-size: 14px; font-weight: bold;">${referenceId}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #666;">Order Date:</td>
              <td style="padding: 6px 0; color: #222;">${orderDate}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #666;">From Restaurant:</td>
              <td style="padding: 6px 0; color: #222;">${restaurantName} (<a href="mailto:${restaurantEmail}" style="color: #B88A52; text-decoration: none;">${restaurantEmail}</a>)</td>
            </tr>
          </table>

          <div style="background-color: #ffffff; border: 1px solid #EBE3D5; border-radius: 12px; padding: 20px; margin-top: 10px;">
            <h4 style="margin: 0 0 10px 0; color: #2C261F; font-size: 14px; border-bottom: 1px solid #FAF6F0; padding-bottom: 8px;">Order Details</h4>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 1px solid #EBE3D5; text-align: left; font-size: 12px; color: #666;">
                  <th style="padding: 6px 0;">Item Description</th>
                  <th style="padding: 6px 0; text-align: right; padding-right: 15px;">Quantity</th>
                  <th style="padding: 6px 0;">Notes / Instructions</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <div style="text-align: center; margin-top: 30px; font-size: 11px; color: #999; border-top: 1px solid #EBE3D5; padding-top: 15px;">
            This purchase order was generated automatically by QRestro on behalf of ${restaurantName}.
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
