import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(request: NextRequest) {
  try {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Check if we are running in simulated demo mode
    const isDemoMode = 
      !keyId || 
      !keySecret || 
      keyId === 'rzp_test_dummy' || 
      keySecret === 'dummy_secret';

    if (isDemoMode) {
      // Return simulated subscription ID for demo sandbox testing
      const mockSubId = `sub_mock_${Math.random().toString(36).substring(2, 12)}`;
      return NextResponse.json({
        subscriptionId: mockSubId,
        amount: 20400, // ₹204.00 (₹199 plan + ₹5 platform fee) in paise
        currency: 'INR',
        keyId: 'rzp_test_dummy',
        isMock: true
      });
    }

    // Initialize Razorpay SDK
    const razorpay = new Razorpay({
      key_id: keyId!,
      key_secret: keySecret!,
    });

    // Resolve Plan ID - prefer environment variable or create one dynamically
    let planId = process.env.RAZORPAY_PLAN_ID;
    if (!planId) {
      try {
        const plan = await razorpay.plans.create({
          period: 'monthly',
          interval: 1,
          item: {
            name: 'TableTap Premium',
            amount: 19900, // ₹199.00 in paise
            currency: 'INR',
            description: 'Monthly Premium Plan for TableTap'
          }
        });
        planId = plan.id;
      } catch (planError: any) {
        console.error('Error creating default plan, checking existing plans:', planError);
        // Fallback: list existing plans and use the first one if available
        const plansList: any = await razorpay.plans.all();
        if (plansList && plansList.items && plansList.items.length > 0) {
          planId = plansList.items[0].id;
        } else {
          throw new Error('Failed to resolve or create a billing plan: ' + planError.message);
        }
      }
    }

    // Create a real Razorpay subscription (Autopay)
    const options: any = {
      plan_id: planId!,
      total_count: 120, // 120 cycles (10 years)
      quantity: 1,
      customer_notify: 1, // Let Razorpay handle email/SMS notifications
      addons: [
        {
          item: {
            name: 'Platform Service Fee',
            amount: 500, // ₹5.00 platform fee in paise
            currency: 'INR'
          }
        }
      ]
    };

    const subscription = await razorpay.subscriptions.create(options);

    return NextResponse.json({
      subscriptionId: subscription.id,
      amount: 20400, // ₹204.00 total in paise
      currency: 'INR',
      keyId: keyId,
      isMock: false
    });
  } catch (error: any) {
    console.error('Error in Razorpay subscription creation route:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to initiate secure subscription session' },
      { status: 500 }
    );
  }
}
