import { NextResponse } from "next/server";
import { PaymentService } from "@/lib/payment-service";
import { MerchantService } from "@/lib/merchant-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { walletAddress, planId, amount } = body;

    if (!walletAddress) {
      return NextResponse.json({ error: "walletAddress is required" }, { status: 400 });
    }

    // For demo purposes, we use the Demo Merchant ID
    const demoMerchant = await MerchantService.getDemoMerchant();
    const merchantId = demoMerchant?.id || "00000000-0000-0000-0000-000000000000";

    // Process Payment via Unified Service
    const result = await PaymentService.processPayment({
      merchantId,
      customerWallet: walletAddress,
      amount: Number(amount),
      planId: planId,
      type: "private"
    });

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error, 
        message: result.message 
      }, { status: 402 });
    }

    return NextResponse.json({
      success: true,
      subscriptionId: result.paymentId, // Demo component expects this
      transactionSignature: result.transactionSignature,
      transactionReference: result.transactionReference,
      status: "active",
      message: "Payment processed successfully via unified pipeline"
    });

  } catch (error) {
    console.error("[CloakPay] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
