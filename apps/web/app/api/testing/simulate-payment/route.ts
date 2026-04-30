import { NextResponse } from "next/server";
import { jsonDb } from "@/lib/json-db";

/**
 * TEMPORARY TESTING ENDPOINT
 * 
 * This endpoint simulates a successful payment for testing/demo purposes.
 * It will be replaced with real webhook-based updates once Dodo webhooks are fully integrated.
 * 
 * DO NOT USE IN PRODUCTION
 * 
 * Query params:
 * - subscriptionId: UUID of the subscription to activate (optional - will use latest for wallet)
 * - walletAddress: Solana wallet address to find subscription for (required if subscriptionId not provided)
 * - checkoutSessionId: Checkout session ID to mark as completed (optional)
 * - amountUsdc: Payment amount in USDC (optional - uses plan price if not provided)
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isLikelySolanaWalletAddress(value: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const subscriptionId = searchParams.get("subscriptionId");
  const walletAddress = searchParams.get("walletAddress");
  const checkoutSessionId = searchParams.get("checkoutSessionId");
  const amountUsdcStr = searchParams.get("amountUsdc");

  // Validation
  if (!subscriptionId && !walletAddress) {
    return NextResponse.json(
      {
        error: "Either subscriptionId or walletAddress is required.",
        warning: "This is a temporary testing endpoint. It will be replaced with webhook-based updates.",
      },
      { status: 400 }
    );
  }

  if (walletAddress && !isLikelySolanaWalletAddress(walletAddress)) {
    return NextResponse.json(
      { error: "Invalid Solana wallet address." },
      { status: 400 }
    );
  }

  const initialAmountUsdc = amountUsdcStr ? Number(amountUsdcStr) : null;

  try {
    let finalSubscriptionId = subscriptionId;
    let finalAmountUsdc = initialAmountUsdc;

    // If walletAddress provided, try to find subscription
    if (!finalSubscriptionId && walletAddress) {
      // Get user by wallet
      const users = await jsonDb.listUsers();
      const user = users.find(u => u.walletAddress === walletAddress);
      
      if (user) {
        // Get latest subscription for user
        const subscriptions = await jsonDb.listSubscriptions();
        const userSub = subscriptions
          .filter(s => s.userId === user.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        
        if (userSub) {
          finalSubscriptionId = userSub.id;
        }
      }
    }

    if (!finalSubscriptionId) {
      return NextResponse.json(
        { error: "Could not find a subscription to activate." },
        { status: 404 }
      );
    }

    // Get subscription from JSON DB
    const subscriptions = await jsonDb.listSubscriptions();
    const subscription = subscriptions.find(s => s.id === finalSubscriptionId);

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found." },
        { status: 404 }
      );
    }

    // Get plan price if amount not provided
    if (finalAmountUsdc === null) {
      const plans = await jsonDb.listPlans();
      const plan = plans.find(p => p.id === subscription.planId);
      if (plan) {
        finalAmountUsdc = plan.priceUsdc;
      }
    }

    // Update subscription status to active
    await jsonDb.updateSubscriptionStatus(finalSubscriptionId, "active");

    // Record payment success event
    await jsonDb.recordSubscriptionEvent({
      subscriptionId: finalSubscriptionId,
      eventType: "payment_success",
      provider: "dodo",
      amountUsdc: finalAmountUsdc ?? 0,
      metadata: {
        source: "testing_simulation",
        timestamp: new Date().toISOString(),
        warning: "This payment was simulated for testing. Replace with real webhook in production.",
      },
    });

    return NextResponse.json(
      {
        ok: true,
        subscriptionId: finalSubscriptionId,
        status: "active",
        amount: finalAmountUsdc,
        checkoutSessionUpdated: !!checkoutSessionId,
        warning: "This is a temporary testing endpoint. Real webhook updates will replace this.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[simulate-payment] failed to simulate payment", error);
    return NextResponse.json(
      {
        error: "Failed to simulate payment.",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return NextResponse.json(
    {
      message: "Payment simulation testing endpoint (temporary). Use POST to simulate a successful payment.",
      warning: "This endpoint is for testing only and will be replaced with webhook integration.",
      usage: {
        method: "POST",
        queryParams: {
          subscriptionId: "UUID of subscription to activate (optional if walletAddress provided)",
          walletAddress: "Solana wallet address (optional if subscriptionId provided)",
          checkoutSessionId: "Checkout session ID to mark as completed (optional)",
          amountUsdc: "Payment amount in USDC (optional - uses plan price if not provided)",
        },
        examples: [
          "POST /api/testing/simulate-payment?subscriptionId=<uuid>",
          "POST /api/testing/simulate-payment?walletAddress=<wallet>&checkoutSessionId=<id>&amountUsdc=49",
        ],
      },
    },
    { status: 200 }
  );
}
