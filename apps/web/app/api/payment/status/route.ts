import { NextRequest, NextResponse } from "next/server";
import { withPlatformAuth, platformError } from "@/lib/platform-auth";
import { db } from "@paystream/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/payment/status
 * 
 * Allows merchants to check the status of a payment using a payment ID.
 * Securely scoped to the authenticated merchant.
 */
export const GET = withPlatformAuth(async (req, { merchant }) => {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get("id");

    if (!paymentId) {
      return platformError("Payment ID (id) is required", 400);
    }

    // Query the database for the payment, ensuring it belongs to this merchant
    const result = await db.query(
      `SELECT status, transaction_reference, type 
       FROM payments 
       WHERE id = $1 AND merchant_id = $2`,
      [paymentId, merchant.id]
    );

    const payment = result.rows[0];

    if (!payment) {
      return platformError("Payment not found or unauthorized", 404);
    }

    // Normalize status names if needed (e.g., 'completed' -> 'success')
    const status = payment.status === 'completed' ? 'success' : payment.status;

    return NextResponse.json({
      payment_id: paymentId,
      status: status,
      transaction_reference: payment.transaction_reference || null,
      type: payment.type || 'public'
    });

  } catch (err) {
    console.error("Error fetching payment status:", err);
    return platformError(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
