import { NextRequest, NextResponse } from "next/server";
import { withPlatformAuth, platformError } from "@/lib/platform-auth";
import { db } from "@paystream/db";
import { getMagicBlockService } from "@/lib/magicblock-service";
import { isLikelySolanaWalletAddress, recordSubscriptionEvent } from "@/lib/subscriptions-db";
import bs58 from "bs58";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The system-level signer for private payments
const SIGNER_KEY_BASE58 = process.env.CLOAK_PRIVATE_PAYMENT_SIGNER_KEY;

export const POST = withPlatformAuth(async (req, { merchant }) => {
  try {
    const body = await req.json();
    const { customer_wallet, amount, plan_id } = body;

    // 2. Validate Parameters
    if (!customer_wallet || !isLikelySolanaWalletAddress(customer_wallet)) {
      return platformError("Invalid or missing customer_wallet address", 400);
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return platformError("Invalid or missing amount", 400);
    }

    // 3. Create initial payment record in DB
    const payment = await db.insert("payments", {
      merchant_id: merchant.id,
      wallet_address: customer_wallet,
      amount_usdc: amount,
      plan_id: plan_id || null,
      provider: "cloak",
      execution_layer: "magicblock",
      status: "pending",
    });

    if (!payment) {
      throw new Error("Failed to create payment record");
    }

    // 4. Trigger Private Payment Flow (Cloak + MagicBlock)
    let txResult = null;
    let magicBlockRef = "SIMULATED-REF";

    if (SIGNER_KEY_BASE58) {
      try {
        const magicBlock = getMagicBlockService();
        const signerKey = bs58.decode(SIGNER_KEY_BASE58);
        
        const result = await magicBlock.processAndRoutePrivatePayment(
          signerKey,
          customer_wallet,
          Number(amount),
          {
            merchantId: merchant.id,
            paymentId: payment.id,
            planId: plan_id
          }
        );
        
        txResult = result.transactionSignature;
        magicBlockRef = result.magicBlockReference;

        // Update payment record with signature and status
        await db.update(
          "payments",
          { 
            status: "completed", 
            transaction_reference: txResult,
            provider_payment_id: magicBlockRef
          },
          "id = $1",
          [payment.id]
        );

        // Record event for dashboard
        await recordSubscriptionEvent({
            userId: payment.user_id || "system", // Fallback for platform users
            amountUsdc: Number(amount),
            eventType: "payment_success",
            provider: "cloak",
            executionLayer: "magicblock",
            providerEventId: txResult,
            payload: { merchant_id: merchant.id, magicBlockRef }
        });

      } catch (err) {
        console.error("Private payment execution failed:", err);
        await db.update("payments", { status: "failed" }, "id = $1", [payment.id]);
        return platformError("Private payment execution failed", 500);
      }
    } else {
      console.warn("CLOAK_PRIVATE_PAYMENT_SIGNER_KEY not configured. Simulating payment.");
      // In simulation mode, we still "complete" it for the demo
      await db.update(
        "payments",
        { status: "completed", provider_payment_id: magicBlockRef },
        "id = $1",
        [payment.id]
      );
    }

    // 5. Return success response
    return NextResponse.json({
      status: "success",
      payment_id: payment.id,
      reference_id: magicBlockRef,
      transaction_signature: txResult,
      amount: amount,
      recipient: customer_wallet,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("Payment creation error:", err);
    return platformError(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
