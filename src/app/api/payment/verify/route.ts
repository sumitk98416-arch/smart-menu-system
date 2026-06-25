import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id) {
      return NextResponse.json({ error: 'Missing payment signature components' }, { status: 400 });
    }

    // Check if this was a mock order from demo mode
    const isMock = razorpay_order_id.startsWith('order_mock_');

    if (isMock) {
      return NextResponse.json({ verified: true, isMock: true });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ error: 'Server key secret not configured' }, { status: 500 });
    }

    // Construct the payload as required by Razorpay (order_id + "|" + payment_id)
    const signPayload = `${razorpay_order_id}|${razorpay_payment_id}`;

    // Generate expected signature using HMAC-SHA256
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(signPayload)
      .digest('hex');

    // Verify signatures
    const isSignatureValid = expectedSignature === razorpay_signature;

    if (isSignatureValid) {
      return NextResponse.json({ verified: true, isMock: false });
    } else {
      return NextResponse.json({ 
        verified: false, 
        error: 'Invalid payment signature authentication failed' 
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in Razorpay verification route:', error);
    return NextResponse.json(
      { error: error?.message || 'Verification failed' }, 
      { status: 500 }
    );
  }
}
