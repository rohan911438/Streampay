import { NextResponse } from 'next/server';
import {
  createPendingSubscription,
  findOrCreateUserByWallet,
  isLikelySolanaWalletAddress,
  recordSubscriptionEvent,
  resolveCheckoutPlan,
  updateSubscriptionStatus,
  findLatestSubscriptionIdForUser,
} from '@/lib/subscriptions-db';

/**
 * Test API route to verify Dodo Payments integration.
 * This route runs only on the server side and uses the DODO_PAYMENTS_API_KEY
 * from environment variables to make an authenticated request.
 */
export async function GET() {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'DODO_PAYMENTS_API_KEY is not configured in environment variables.' 
      },
      { status: 500 }
    );
  }

  try {
    const BASE_URL = 'https://test.dodopayments.com';

    // Step 1: Determine which product to use
    let productId = process.env.DODO_SUBSCRIPTION_PRODUCT_ID;

    if (!productId || productId === 'p_placeholder_test') {
      // Fallback: List products to find a valid one if none configured
      const productsResponse = await fetch(`${BASE_URL}/products?page_size=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const productsData = await productsResponse.json();

      if (productsResponse.ok && productsData.items && productsData.items.length > 0) {
        productId = productsData.items[0].product_id;
        console.log(`Using product from API: ${productId}`);
      } else {
        return NextResponse.json({
          success: false,
          error: 'No product ID configured and no products found in your Dodo account.',
          debug: { products_api_response: productsData }
        }, { status: 400 });
      }
    } else {
      console.log(`Using product from environment: ${productId}`);
    }

    // Step 2: Create a checkout session with the valid product
    const checkoutResponse = await fetch(`${BASE_URL}/checkouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_cart: [
          {
            product_id: productId,
            quantity: 1,
          },
        ],
        customer: {
          email: 'test-customer@example.com',
          name: 'Test Customer',
        },
        billing_address: {
          country: 'US',
        },
        return_url: 'https://example.com/success',
      }),
    });

    const checkoutData = await checkoutResponse.json();

    if (!checkoutResponse.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: checkoutData.detail || checkoutData.message || 'Failed to create checkout session',
          debug: checkoutData 
        },
        { status: checkoutResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully verified Dodo Payments integration',
      data: {
        used_product_id: productId,
        checkout_url: checkoutData.checkout_url,
        payment_id: checkoutData.payment_id,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'An unexpected error occurred' 
      },
      { status: 500 }
    );
  }
}

type SimulatePaymentRequestBody = {
  walletAddress?: string;
  amountUsdc?: number;
  status?: 'success' | 'failed';
};

export async function POST(req: Request) {
  let body: SimulatePaymentRequestBody;

  try {
    body = (await req.json()) as SimulatePaymentRequestBody;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const walletAddress = body.walletAddress?.trim();
  const amountUsdc = typeof body.amountUsdc === 'number' && Number.isFinite(body.amountUsdc) ? body.amountUsdc : 49;
  const status = body.status === 'failed' ? 'failed' : 'success';

  if (!walletAddress || !isLikelySolanaWalletAddress(walletAddress)) {
    return NextResponse.json({ success: false, error: 'A valid wallet address is required.' }, { status: 400 });
  }

  try {
    const user = await findOrCreateUserByWallet(walletAddress);

    let subscriptionId = await findLatestSubscriptionIdForUser(user.id);

    if (!subscriptionId) {
      const plan = await resolveCheckoutPlan(process.env.DODO_SUBSCRIPTION_PRODUCT_ID);
      const pendingSubscription = await createPendingSubscription(user.id, plan);
      subscriptionId = pendingSubscription.id;
    }

    await recordSubscriptionEvent({
      userId: user.id,
      subscriptionId,
      amountUsdc,
      eventType: status === 'success' ? 'payment_success' : 'payment_failed',
      providerEventId: `sim_${Date.now()}`,
      payload: {
        source: 'simulation',
        walletAddress,
        amountUsdc,
      },
    });

    if (status === 'success') {
      await updateSubscriptionStatus({
        subscriptionId,
        status: 'active',
      });
    }

    return NextResponse.json({
      success: true,
      walletAddress,
      subscriptionId,
      status,
      amountUsdc,
    });
  } catch (error) {
    console.error('[dodo-test] payment simulation failed', error);
    return NextResponse.json(
      { success: false, error: 'Failed to simulate payment event.' },
      { status: 500 }
    );
  }
}
