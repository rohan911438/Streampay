import { NextResponse } from "next/server";
import { getCloakService } from "@paystream/solana";
import { db } from "@paystream/db";
import { Keypair } from "@solana/web3.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Request body for pay endpoint
 */
interface PayRequestBody {
  walletAddress: string;
  planId: string;
  senderPrivateKey: string; // Base64 encoded
  amount?: number; // Optional, will be fetched from plan if not provided
}

/**
 * POST /api/cloak/pay
 *
 * Execute a private payment for a subscription plan
 *
 * Request body:
 * {
 *   "walletAddress": "user-solana-wallet",
 *   "planId": "plan-uuid",
 *   "senderPrivateKey": "base64-encoded-private-key",
 *   "amount": 99.99  // Optional
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "subscriptionId": "subscription-uuid",
 *   "transactionSignature": "tx-hash",
 *   "status": "active",
 *   "message": "Payment processed successfully"
 * }
 */
export async function POST(req: Request) {
  try {
    let body: PayRequestBody;

    try {
      body = (await req.json()) as PayRequestBody;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // Validate inputs
    const { walletAddress, planId, senderPrivateKey, amount } = body;

    if (!walletAddress || typeof walletAddress !== "string") {
      return NextResponse.json(
        { error: "walletAddress is required" },
        { status: 400 }
      );
    }

    if (!planId || typeof planId !== "string") {
      return NextResponse.json(
        { error: "planId is required" },
        { status: 400 }
      );
    }

    if (!senderPrivateKey || typeof senderPrivateKey !== "string") {
      return NextResponse.json(
        { error: "senderPrivateKey is required" },
        { status: 400 }
      );
    }

    // Decode private key
    let privateKeyBytes: Uint8Array;
    try {
      const buffer = Buffer.from(senderPrivateKey, "base64");
      if (buffer.length !== 64) {
        throw new Error("Private key must be 64 bytes");
      }
      privateKeyBytes = new Uint8Array(buffer);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid private key format" },
        { status: 400 }
      );
    }

    // Get plan details
    const planResult = await db.query(
      "SELECT * FROM plans WHERE id = $1 AND is_active = true",
      [planId]
    );

    const plan = planResult.rows[0];
    if (!plan) {
      return NextResponse.json(
        { error: "Plan not found or is inactive" },
        { status: 404 }
      );
    }

    const paymentAmount = amount || parseFloat(plan.price_usdc);

    if (paymentAmount <= 0) {
      return NextResponse.json(
        { error: "Payment amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Get merchant wallet address from environment
    const merchantWalletAddress = process.env.MERCHANT_WALLET_ADDRESS;
    if (!merchantWalletAddress) {
      console.error("[pay] MERCHANT_WALLET_ADDRESS not configured");
      return NextResponse.json(
        { error: "Payment service misconfigured" },
        { status: 500 }
      );
    }

    // Get or create user
    const userResult = await db.query(
      "SELECT * FROM users WHERE wallet_address = $1",
      [walletAddress]
    );

    let userId: string;
    if (userResult.rows.length > 0) {
      userId = userResult.rows[0].id;
    } else {
      // Create new user
      const createUserResult = await db.insert(
        "users",
        {
          wallet_address: walletAddress,
          created_at: new Date(),
          updated_at: new Date(),
        },
        "id"
      );
      const createdUser = createUserResult?.[0];

      if (!createdUser?.id) {
        console.error("[pay] Failed to create user");
        return NextResponse.json(
          { error: "Failed to create user account" },
          { status: 500 }
        );
      }

      userId = createdUser.id;
    }

    // Create subscription record
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    const subscriptionResult = await db.insert(
      "subscriptions",
      {
        user_id: userId,
        plan_id: planId,
        status: "pending", // Will be updated to active after successful payment
        start_date: new Date(),
        next_billing_date: nextBillingDate,
        created_at: new Date(),
        updated_at: new Date(),
      },
      "id"
    );

    const createdSubscription = subscriptionResult?.[0];
    if (!createdSubscription?.id) {
      console.error("[pay] Failed to create subscription");
      return NextResponse.json(
        { error: "Failed to create subscription" },
        { status: 500 }
      );
    }

    const subscriptionId = createdSubscription.id;

    // Execute private transfer using Cloak service
    const cloakService = getCloakService();

    let transactionSignature: string;
    let transactionReference: string;

    try {
      const transferResult = await cloakService.executePrivateTransfer(
        privateKeyBytes,
        merchantWalletAddress,
        paymentAmount,
        undefined, // use default USDC mint
        {
          description: `Plan purchase: ${plan.name}`,
          invoiceId: subscriptionId,
          orderId: `SUB-${subscriptionId}`,
        }
      );

      transactionSignature = transferResult.transactionSignature;
      transactionReference = transferResult.transactionReference;

      // Store transaction details
      const senderKeypair = Keypair.fromSecretKey(privateKeyBytes);
      const senderAddress = senderKeypair.publicKey.toString();

      await db.insert(
        "private_transactions",
        {
          user_id: userId,
          subscription_id: subscriptionId,
          sender_address: senderAddress,
          recipient_address: merchantWalletAddress,
          amount_usdc: paymentAmount,
          transaction_signature: transactionSignature,
          transaction_reference: transactionReference,
          status: "confirmed",
          confirmation_status: "confirmed",
          metadata: JSON.stringify({
            planName: plan.name,
            planId: planId,
            billingInterval: plan.billing_interval,
          }),
          created_at: new Date(),
          updated_at: new Date(),
          confirmed_at: new Date(),
        },
        "*"
      );

      // Update subscription to active
      await db.update(
        "subscriptions",
        {
          status: "active",
          updated_at: new Date(),
        },
        "id = $1",
        [subscriptionId],
        "*"
      );

      // Record subscription event
      await db.insert(
        "subscription_events",
        {
          user_id: userId,
          subscription_id: subscriptionId,
          amount_usdc: paymentAmount,
          event_type: "payment_success",
          provider_event_id: transactionSignature,
          payload: JSON.stringify({
            method: "cloak_private_transfer",
            transactionSignature,
            planId,
          }),
          occurred_at: new Date(),
          created_at: new Date(),
        },
        "*"
      );

      console.log("[pay] Payment processed successfully", {
        userId,
        subscriptionId,
        planId,
        amount: paymentAmount,
        signature: transactionSignature,
      });

      return NextResponse.json(
        {
          success: true,
          subscriptionId,
          transactionSignature,
          status: "active",
          message: "Payment processed successfully. Subscription activated.",
        },
        { status: 200 }
      );
    } catch (transferError) {
      const errorMessage =
        transferError instanceof Error
          ? transferError.message
          : String(transferError);

      console.error("[pay] Transfer failed", {
        userId,
        subscriptionId,
        planId,
        error: errorMessage,
      });

      // Record failed payment event
      await db.insert(
        "subscription_events",
        {
          user_id: userId,
          subscription_id: subscriptionId,
          amount_usdc: paymentAmount,
          event_type: "payment_failed",
          payload: JSON.stringify({
            method: "cloak_private_transfer",
            error: errorMessage,
          }),
          occurred_at: new Date(),
          created_at: new Date(),
        },
        "*"
      );

      // Update subscription to failed
      await db.update(
        "subscriptions",
        {
          status: "canceled",
          canceled_at: new Date(),
          updated_at: new Date(),
        },
        "id = $1",
        [subscriptionId],
        "*"
      );

      return NextResponse.json(
        {
          success: false,
          subscriptionId,
          error: "Payment failed",
          message: errorMessage,
        },
        { status: 402 } // 402 Payment Required
      );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    console.error("[pay] Unexpected error", errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
