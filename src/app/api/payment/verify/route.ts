import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      razorpay_subscription_id 
    } = await request.json();

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Handle Subscription Verification (Autopay)
    if (razorpay_subscription_id) {
      const isMock = razorpay_subscription_id.startsWith('sub_mock_');
      if (isMock) {
        return NextResponse.json({ verified: true, isMock: true });
      }

      if (!keySecret) {
        return NextResponse.json({ error: 'Server key secret not configured' }, { status: 500 });
      }

      // Payload for subscription is payment_id + "|" + subscription_id
      const signPayload = `${razorpay_payment_id}|${razorpay_subscription_id}`;
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(signPayload)
        .digest('hex');

      const isSignatureValid = expectedSignature === razorpay_signature;
      if (isSignatureValid) {
        return NextResponse.json({ verified: true, isMock: false });
      } else {
        return NextResponse.json({ 
          verified: false, 
          error: 'Invalid subscription payment signature' 
        }, { status: 400 });
      }
    }

    // Handle Order Verification (One-time payment)
    if (!razorpay_order_id || !razorpay_payment_id) {
      return NextResponse.json({ error: 'Missing payment signature components' }, { status: 400 });
    }

    const isMock = razorpay_order_id.startsWith('order_mock_');
    if (isMock) {
      return NextResponse.json({ verified: true, isMock: true });
    }

    if (!keySecret) {
      return NextResponse.json({ error: 'Server key secret not configured' }, { status: 500 });
    }

    const signPayload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(signPayload)
      .digest('hex');

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
