import { NextRequest, NextResponse } from "next/server";
import { withPlatformAuth, platformError } from "@/lib/platform-auth";
import { db } from "@paystream/db";
import { isLikelySolanaWalletAddress } from "@/lib/subscriptions-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/subscription/create
 * 
 * Allows merchants to create subscription plans and link them to users.
 * Supports plan creation, initial pending status, and renewal tracking setup.
 */
export const POST = withPlatformAuth(async (req, { merchant }) => {
  try {
    const body = await req.json();
    const { 
      plan_name, 
      amount_usdc, 
      billing_interval, 
      customer_wallet,
      description
    } = body;

    // 1. Validate Parameters
    if (!customer_wallet || !isLikelySolanaWalletAddress(customer_wallet)) {
      return platformError("Invalid or missing customer_wallet address", 400);
    }

    if (!plan_name || plan_name.length < 2) {
      return platformError("Invalid or missing plan_name", 400);
    }

    if (!amount_usdc || isNaN(Number(amount_usdc)) || Number(amount_usdc) < 0) {
      return platformError("Invalid or missing amount_usdc", 400);
    }

    if (!['monthly', 'yearly'].includes(billing_interval)) {
      return platformError("billing_interval must be 'monthly' or 'yearly'", 400);
    }

    // 2. Find or Create User
    // Note: In this architecture, users are identified by wallet. 
    // We link them to the merchant if not already linked.
    let userResult = await db.query(
      "SELECT id FROM users WHERE wallet_address = $1",
      [customer_wallet]
    );

    let userId: string;

    if (userResult.rows.length === 0) {
      const newUser = await db.insert("users", {
        wallet_address: customer_wallet,
        merchant_id: merchant.id
      });
      if (!newUser) throw new Error("Failed to create user");
      userId = newUser.id;
    } else {
      userId = userResult.rows[0].id;
      // Optionally update merchant_id if it was null (e.g. from a previous legacy system)
      await db.query(
        "UPDATE users SET merchant_id = $1 WHERE id = $2 AND merchant_id IS NULL",
        [merchant.id, userId]
      );
    }

    // 3. Find or Create Plan (scoped to merchant)
    let planResult = await db.query(
      "SELECT id FROM plans WHERE name = $1 AND merchant_id = $2 AND price_usdc = $3 AND billing_interval = $4",
      [plan_name, merchant.id, amount_usdc, billing_interval]
    );

    let planId: string;

    if (planResult.rows.length === 0) {
      const newPlan = await db.insert("plans", {
        name: plan_name,
        price_usdc: amount_usdc,
        billing_interval: billing_interval,
        description: description || null,
        merchant_id: merchant.id,
        is_active: true
      });
      if (!newPlan) throw new Error("Failed to create plan");
      planId = newPlan.id;
    } else {
      planId = planResult.rows[0].id;
    }

    // 4. Create Subscription (Pending until payment)
    const subscription = await db.insert("subscriptions", {
      user_id: userId,
      plan_id: planId,
      merchant_id: merchant.id,
      status: "pending",
      start_date: new Date(),
      // next_billing_date will be set upon activation (successful payment)
    });

    if (!subscription) {
      throw new Error("Failed to create subscription record");
    }

    // 5. Return success response
    return NextResponse.json({
      status: "success",
      subscription_id: subscription.id,
      customer: {
        wallet: customer_wallet,
        user_id: userId
      },
      plan: {
        id: planId,
        name: plan_name,
        amount: amount_usdc,
        interval: billing_interval
      },
      subscription_status: "pending",
      message: "Subscription created. It will be activated after the first successful payment."
    });

  } catch (err) {
    console.error("Subscription creation error:", err);
    return platformError(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
