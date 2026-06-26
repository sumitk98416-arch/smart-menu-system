import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(request: NextRequest) {
  try {
    const { amount, orderNumber } = await request.json();

    if (!amount || isNaN(amount)) {
      return NextResponse.json({ error: 'Invalid or missing amount' }, { status: 400 });
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Check if we are running in simulated demo mode
    const isDemoMode = 
      !keyId || 
      !keySecret || 
      keyId === 'rzp_test_dummy' || 
      keySecret === 'dummy_secret';

    if (isDemoMode) {
      // Return a simulated order ID for demo/sandbox testing
      const mockOrderId = `order_mock_${Math.random().toString(36).substring(2, 10)}`;
      return NextResponse.json({
        orderId: mockOrderId,
        amount: Math.round(amount * 100),
        currency: 'INR',
        keyId: 'rzp_test_dummy',
        isMock: true
      });
    }

    // Initialize real Razorpay SDK
    const razorpay = new Razorpay({
      key_id: keyId!,
      key_secret: keySecret!,
    });

    // Create a real Razorpay Order (amount is in paisa, e.g., Rs 10.00 = 1000 paisa)
    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `receipt_order_${orderNumber || Math.floor(Math.random() * 10000)}`,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: keyId,
      isMock: false
    });
  } catch (error: any) {
    console.error('Error in Razorpay order creation route:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create payment order' }, 
      { status: 500 }
    );
  }
}
