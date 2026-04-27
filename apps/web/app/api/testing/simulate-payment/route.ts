import { NextResponse } from "next/server";
import {
  findLatestSubscriptionIdForUser,
  findOrCreateUserByWallet,
  updateSubscriptionStatus,
  recordSubscriptionEvent,
  updateCheckoutSessionRecordStatus,
  isLikelySolanaWalletAddress,
  resolveCheckoutPlan,
} from "@/lib/subscriptions-db";
import { db } from "@paystream/db";

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
        error:
          "Either subscriptionId or walletAddress is required.",
        warning:
          "This is a temporary testing endpoint. It will be replaced with webhook-based updates.",
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
    let userId: string | null = null;
    let finalAmountUsdc = initialAmountUsdc;

    // Resolve subscription and user
    if (walletAddress) {
      const user = await findOrCreateUserByWallet(walletAddress);
      userId = user.id;

      if (!finalSubscriptionId) {
        finalSubscriptionId = await findLatestSubscriptionIdForUser(userId);
      }
    }

    if (!finalSubscriptionId) {
      return NextResponse.json(
        { error: "Could not find a subscription to activate." },
        { status: 404 }
      );
    }

    // Get subscription details to find user_id and amount if not already known
    if (!userId) {
      const subResult = await db.query<{ user_id: string; plan_id: string }>(
        "SELECT user_id, plan_id FROM subscriptions WHERE id = $1 LIMIT 1",
        [finalSubscriptionId]
      );

      if (!subResult.rows[0]) {
        return NextResponse.json(
          { error: "Subscription not found." },
          { status: 404 }
        );
      }

      userId = subResult.rows[0].user_id;

      // Get plan price if amount not provided
      if (finalAmountUsdc === null) {
        const planResult = await db.query<{ price_usdc: string }>(
          "SELECT price_usdc FROM plans WHERE id = $1 LIMIT 1",
          [subResult.rows[0].plan_id]
        );

        if (planResult.rows[0]) {
          const planPrice = Number(planResult.rows[0].price_usdc);
          if (Number.isFinite(planPrice)) {
            finalAmountUsdc = planPrice;
          }
        }
      }
    }

    // Mark subscription as active
    await updateSubscriptionStatus({
      subscriptionId: finalSubscriptionId,
      status: "active",
    });

    // Record payment success event
    await recordSubscriptionEvent({
      userId,
      subscriptionId: finalSubscriptionId,
      amountUsdc: finalAmountUsdc ?? undefined,
      eventType: "payment_success",
      payload: {
        source: "testing_simulation",
        timestamp: new Date().toISOString(),
        warning:
          "This payment was simulated for testing. Replace with real webhook in production.",
      },
    });

    // Update checkout session if provided
    if (checkoutSessionId) {
      await updateCheckoutSessionRecordStatus({
        checkoutSessionId,
        subscriptionId: finalSubscriptionId,
        status: "completed",
      });
    }

    return NextResponse.json(
      {
        ok: true,
        subscriptionId: finalSubscriptionId,
        status: "active",
        amount: finalAmountUsdc,
        checkoutSessionUpdated: !!checkoutSessionId,
        warning:
          "This is a temporary testing endpoint. Real webhook updates will replace this.",
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
  const { searchParams } = new URL(req.url);

  return NextResponse.json(
    {
      message:
        "Payment simulation testing endpoint (temporary). Use POST to simulate a successful payment.",
      warning: "This endpoint is for testing only and will be replaced with webhook integration.",
      usage: {
        method: "POST",
        queryParams: {
          subscriptionId:
            "UUID of subscription to activate (optional if walletAddress provided)",
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
