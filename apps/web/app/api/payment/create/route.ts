import { NextRequest, NextResponse } from "next/server";
import { withPlatformAuth, platformError } from "@/lib/platform-auth";
import { PaymentService } from "@/lib/payment-service";
import { isLikelySolanaWalletAddress } from "@/lib/subscriptions-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withPlatformAuth(async (req, { merchant }) => {
  try {
    const body = await req.json();
    const { customer_wallet, amount, plan_id, customer_email } = body;

    // 1. Validate Parameters
    if (!customer_wallet || !isLikelySolanaWalletAddress(customer_wallet)) {
      return platformError("Invalid or missing customer_wallet address", 400);
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return platformError("Invalid or missing amount", 400);
    }

    // 2. Process Payment via Unified Service
    const result = await PaymentService.processPayment({
      merchantId: merchant.id,
      customerWallet: customer_wallet,
      amount: Number(amount),
      planId: plan_id,
      type: "private", // Platform API defaults to private/cloak flow
      customerEmail: customer_email
    });

    if (!result.success) {
      return platformError(result.error || "Payment execution failed", 500);
    }

    // 3. Return success response
    return NextResponse.json({
      status: "success",
      payment_id: result.paymentId,
      reference_id: result.transactionReference,
      transaction_signature: result.transactionSignature,
      amount: amount,
      recipient: customer_wallet,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("Payment creation error:", err);
    return platformError(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
