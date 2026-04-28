import { NextResponse } from "next/server";
import { Keypair, PublicKey } from "@solana/web3.js";
import { getCloakService } from "@paystream/solana";
import { db } from "@paystream/db";
import { recordSubscriptionEvent } from "@/lib/subscriptions-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PayRequestBody {
  walletAddress: string;
  planId?: string;
  amount?: number;
  senderPrivateKey?: string;
}

function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

function decodePrivateKey(base64Key: string): Uint8Array {
  const buffer = Buffer.from(base64Key, "base64");

  if (buffer.length !== 64) {
    throw new Error("Private key must be 64 bytes");
  }

  return new Uint8Array(buffer);
}

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

    const { walletAddress, planId, senderPrivateKey, amount } = body;

    if (!walletAddress || typeof walletAddress !== "string") {
      return NextResponse.json(
        { error: "walletAddress is required" },
        { status: 400 }
      );
    }

    if (!isValidSolanaAddress(walletAddress)) {
      return NextResponse.json(
        { error: "walletAddress is not a valid Solana address" },
        { status: 400 }
      );
    }

    if (planId !== undefined && typeof planId !== "string") {
      return NextResponse.json(
        { error: "planId must be a string when provided" },
        { status: 400 }
      );
    }

    if (amount !== undefined && (typeof amount !== "number" || !Number.isFinite(amount))) {
      return NextResponse.json(
        { error: "amount must be a finite number when provided" },
        { status: 400 }
      );
    }

    const planResult = planId
      ? await db.query(
          "SELECT id, name, price_usdc, billing_interval FROM plans WHERE id = $1 AND is_active = true LIMIT 1",
          [planId]
        )
      : await db.query(
          "SELECT id, name, price_usdc, billing_interval FROM plans WHERE is_active = true ORDER BY created_at ASC LIMIT 1"
        );

    const plan = planResult.rows[0];
    if (!plan) {
      return NextResponse.json(
        { error: planId ? "Plan not found or is inactive" : "No active plan is available" },
        { status: 404 }
      );
    }

    const paymentAmount = amount ?? Number(plan.price_usdc);

    if (paymentAmount <= 0) {
      return NextResponse.json(
        { error: "Payment amount must be greater than 0" },
        { status: 400 }
      );
    }

    const merchantWalletAddress = process.env.MERCHANT_WALLET_ADDRESS;
    if (!merchantWalletAddress) {
      console.error("[pay] MERCHANT_WALLET_ADDRESS not configured");
      return NextResponse.json(
        { error: "Payment service misconfigured" },
        { status: 500 }
      );
    }

    const signerKeyBase64 = senderPrivateKey?.trim() || process.env.CLOAK_PRIVATE_PAYMENT_SIGNER_KEY?.trim();

    if (!signerKeyBase64) {
      return NextResponse.json(
        {
          error: "Payment signer is not configured",
          details: "Set CLOAK_PRIVATE_PAYMENT_SIGNER_KEY or pass senderPrivateKey for testing.",
        },
        { status: 500 }
      );
    }

    let privateKeyBytes: Uint8Array;

    try {
      privateKeyBytes = decodePrivateKey(signerKeyBase64);
    } catch (error) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Invalid private key format",
        },
        { status: 400 }
      );
    }

    const signerKeypair = Keypair.fromSecretKey(privateKeyBytes);
    const signerAddress = signerKeypair.publicKey.toBase58();

    if (senderPrivateKey && signerAddress !== walletAddress) {
      return NextResponse.json(
        {
          error: "walletAddress does not match the supplied senderPrivateKey",
        },
        { status: 400 }
      );
    }

    const userResult = await db.query(
      "SELECT * FROM users WHERE wallet_address = $1",
      [walletAddress]
    );

    let userId: string;
    if (userResult.rows.length > 0) {
      userId = userResult.rows[0].id;
    } else {
      const createdUser = await db.insert<{ id: string }>(
        "users",
        {
          wallet_address: walletAddress,
          created_at: new Date(),
          updated_at: new Date(),
        },
        "id"
      );

      if (!createdUser?.id) {
        console.error("[pay] Failed to create user");
        return NextResponse.json(
          { error: "Failed to create user account" },
          { status: 500 }
        );
      }

      userId = createdUser.id;
    }

    const existingSubscriptionResult = await db.query(
      "SELECT id, status FROM subscriptions WHERE user_id = $1 AND plan_id = $2 AND status IN ('pending', 'active') ORDER BY created_at DESC LIMIT 1",
      [userId, plan.id]
    );

    let subscriptionId: string;

    if (existingSubscriptionResult.rows[0]) {
      subscriptionId = existingSubscriptionResult.rows[0].id;
    } else {
      const nextBillingDate = new Date();
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

      const createdSubscription = await db.insert<{ id: string }>(
        "subscriptions",
        {
          user_id: userId,
          plan_id: plan.id,
          status: "pending",
          start_date: new Date(),
          next_billing_date: nextBillingDate,
          created_at: new Date(),
          updated_at: new Date(),
        },
        "id"
      );

      if (!createdSubscription?.id) {
        console.error("[pay] Failed to create subscription");
        return NextResponse.json(
          { error: "Failed to create subscription" },
          { status: 500 }
        );
      }

      subscriptionId = createdSubscription.id;
    }

    const cloakService = getCloakService();

    try {
      const transferResult = await cloakService.executePrivateTransfer(
        privateKeyBytes,
        merchantWalletAddress,
        paymentAmount,
        undefined,
        {
          description: `Private payment for ${plan.name}`,
          invoiceId: subscriptionId,
          orderId: `PLAN-${plan.id}`,
          planId: plan.id,
          walletAddress,
        }
      );

      await db.insert(
        "private_transactions",
        {
          user_id: userId,
          subscription_id: subscriptionId,
          sender_address: signerAddress,
          recipient_address: merchantWalletAddress,
          amount_usdc: paymentAmount,
          transaction_signature: transferResult.transactionSignature,
          transaction_reference: transferResult.transactionReference,
          status: transferResult.status,
          confirmation_status: transferResult.status,
          metadata: {
            planId: plan.id,
            planName: plan.name,
            walletAddress,
            paymentAmount,
            paymentMethod: "cloak_private_payment",
          },
          created_at: new Date(),
          updated_at: new Date(),
          confirmed_at: transferResult.status === "confirmed" ? new Date() : null,
        },
        "id"
      );

      // Record a unified payment row so dashboard and reports show Cloak payments
      try {
        await db.insert(
          "payments",
          {
            user_id: userId,
            plan_id: plan.id,
            subscription_id: subscriptionId,
            provider_payment_id: transferResult.transactionSignature,
            provider_event_id: transferResult.transactionReference,
            provider: "cloak",
            transaction_reference: transferResult.transactionReference,
            amount_usdc: paymentAmount,
            currency: "USDC",
            customer_email: null,
            wallet_address: walletAddress,
            paid_at: new Date(),
            payload: {
              method: "cloak_private_payment",
              transactionSignature: transferResult.transactionSignature,
              transactionReference: transferResult.transactionReference,
              planId: plan.id,
              planName: plan.name,
              walletAddress,
            },
            created_at: new Date(),
          },
          "id"
        );
      } catch (e) {
        console.error("[pay] Failed to insert payments row for cloak transfer", e);
      }

      await db.update(
        "subscriptions",
        {
          status: "active",
          start_date: new Date(),
          next_billing_date: (() => {
            const nextBillingDate = new Date();
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
            return nextBillingDate;
          })(),
          canceled_at: null,
          updated_at: new Date(),
        },
        "id = $1",
        [subscriptionId],
        "id"
      );

      await db.insert(
        "subscription_events",
        {
          user_id: userId,
          subscription_id: subscriptionId,
          amount_usdc: paymentAmount,
          event_type: "payment_success",
          provider_event_id: transferResult.transactionSignature,
          payload: {
            method: "cloak_private_payment",
            planId: plan.id,
            planName: plan.name,
            walletAddress,
            transactionSignature: transferResult.transactionSignature,
            transactionReference: transferResult.transactionReference,
          },
          occurred_at: new Date(),
          created_at: new Date(),
        },
        "id"
      );

      // Record to dashboard (jsonDb)
      await recordSubscriptionEvent({
        userId,
        subscriptionId,
        amountUsdc: paymentAmount,
        eventType: "payment_success",
        provider: "cloak",
        providerEventId: transferResult.transactionSignature,
        payload: {
          method: "cloak_private_payment",
          planId: plan.id,
          walletAddress,
        }
      });

      return NextResponse.json(
        {
          success: true,
          paymentMethod: "cloak",
          subscriptionId,
          planId: plan.id,
          amount: paymentAmount,
          transactionSignature: transferResult.transactionSignature,
          transactionReference: transferResult.transactionReference,
          status: "active",
          message: "Private payment processed successfully. Subscription activated.",
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
        planId: plan.id,
        error: errorMessage,
      });

      await db.insert(
        "subscription_events",
        {
          user_id: userId,
          subscription_id: subscriptionId,
          amount_usdc: paymentAmount,
          event_type: "payment_failed",
          payload: {
            method: "cloak_private_payment",
            planId: plan.id,
            planName: plan.name,
            walletAddress,
            error: errorMessage,
          },
          occurred_at: new Date(),
          created_at: new Date(),
        },
        "id"
      );

      await db.update(
        "subscriptions",
        {
          status: "canceled",
          canceled_at: new Date(),
          updated_at: new Date(),
        },
        "id = $1",
        [subscriptionId],
        "id"
      );

      return NextResponse.json(
        {
          success: false,
          paymentMethod: "cloak",
          subscriptionId,
          error: "Payment failed",
          message: errorMessage,
        },
        { status: 402 }
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
