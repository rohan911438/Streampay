import { NextRequest, NextResponse } from "next/server";
import { db } from "@paystream/db";
import { jsonDb } from "@/lib/json-db";
import { dbConfig } from "@/lib/db-config";
import { PaymentService } from "@/lib/payment-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/payment/confirm
 * 
 * Confirms a successful on-chain transaction and updates the backend database.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { txSignature, wallet, amount, referenceId, type, merchantId, planId, customerEmail } = body;

    console.group('🟣 [PaymentConfirm] Finalizing Transaction');
    console.log(`[Confirm] Signature: ${txSignature}`);
    console.log(`[Confirm] Wallet: ${wallet}`);
    console.log(`[Confirm] Amount: ${amount} USDC`);

    if (!txSignature || !wallet) {
      return NextResponse.json(
        { error: "txSignature and wallet are required" },
        { status: 400 }
      );
    }

    // 1. Check if payment record already exists (via referenceId or paymentId)
    // If not, create a new one.
    let paymentId = referenceId;
    let payment: any = null;

    if (paymentId && paymentId.length > 10) {
        // Try to find by ID
        if (dbConfig.shouldTryPostgres()) {
            try {
                const result = await db.query("SELECT * FROM payments WHERE id = $1", [paymentId]);
                payment = result.rows[0];
            } catch (err) {}
        }
        if (!payment) {
            const payments = await jsonDb.listPayments();
            payment = payments.find(p => p.id === paymentId);
        }
    }

    if (!payment) {
        console.log("[Confirm] No existing payment record found. Creating new entry.");
        // Create new record
        if (dbConfig.shouldTryPostgres()) {
            try {
                payment = await db.insert("payments", {
                    merchant_id: merchantId || process.env.MERCHANT_WALLET_ADDRESS,
                    wallet_address: wallet,
                    amount_usdc: amount,
                    plan_id: planId || null,
                    provider: "cloak",
                    execution_layer: "solana",
                    status: "success",
                    type: type || "public",
                    transaction_reference: txSignature,
                    customer_email: customerEmail || null
                });
                paymentId = payment.id;
            } catch (err: any) {
                console.error("[Confirm] DB Insert failed:", err);
            }
        }

        if (!payment) {
            payment = await jsonDb.createPayment({
                merchantId: merchantId || "demo-merchant",
                walletAddress: wallet,
                amountUsdc: amount,
                planId: planId || null,
                status: "success",
                type: type || "public",
                provider: "cloak",
                executionLayer: "solana",
                transactionReference: txSignature,
                userId: null,
                subscriptionId: null
            });
            paymentId = payment.id;
        }
    } else {
        console.log(`[Confirm] Found existing record ${payment.id}. Updating status.`);
        // Update existing record
        await PaymentService.updatePaymentStatus(payment.id, "success", {
            transaction_reference: txSignature,
            status: "success"
        });
    }

    console.log(`[Confirm] Payment ${paymentId} successfully recorded in database.`);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      paymentId: paymentId,
      message: "Payment confirmed and recorded in backend."
    });

  } catch (error) {
    console.error("[PaymentConfirm] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to confirm payment",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
