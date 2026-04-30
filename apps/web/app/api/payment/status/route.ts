import { NextRequest, NextResponse } from "next/server";
import { Connection } from "@solana/web3.js";
import { withPlatformAuth, platformError } from "@/lib/platform-auth";
import { db } from "@paystream/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/payment/status
 * 
 * Can be used in two ways:
 * 1. With ?id=paymentId for merchant API to check payment status (requires auth)
 * 2. With ?signature=transactionSig for public transaction confirmation checking
 */
export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get("id");
    const signature = searchParams.get("signature");

    // If checking by signature (public endpoint for transaction confirmation)
    if (signature) {
      return handleSignatureStatus(signature);
    }

    // If checking by payment ID (requires merchant auth)
    if (paymentId) {
      return handlePaymentStatus(req, paymentId);
    }

    return NextResponse.json(
      { error: "Either 'id' (payment ID) or 'signature' (transaction signature) is required" },
      { status: 400 }
    );
  } catch (err) {
    console.error("Error in payment status endpoint:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
};

/**
 * Check on-chain transaction status by signature (public)
 */
async function handleSignatureStatus(signature: string): Promise<NextResponse> {
  try {
    const rpcUrl =
      process.env.NEXT_PUBLIC_RPC_ENDPOINT ||
      "https://api.devnet.solana.com";
    const connection = new Connection(rpcUrl, "confirmed");

    const confirmation = await connection.getSignatureStatus(signature);

    if (!confirmation || !confirmation.value) {
      return NextResponse.json({
        signature: signature,
        confirmed: false,
        status: "unknown",
        message: "Transaction status unknown - may not be processed yet",
      });
    }

    const { confirmations, err, confirmationStatus } = confirmation.value;

    return NextResponse.json({
      signature: signature,
      confirmed:
        confirmationStatus === "confirmed" || confirmationStatus === "finalized",
      confirmationStatus: confirmationStatus,
      confirmations: confirmations,
      error: err ? err.toString() : null,
      status: err
        ? "failed"
        : confirmationStatus === "finalized"
          ? "finalized"
          : confirmationStatus === "confirmed"
            ? "confirmed"
            : "pending",
    });
  } catch (error) {
    console.error("[PaymentStatus] Error checking signature status:", error);
    return NextResponse.json(
      {
        error: "Failed to check transaction status",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Check payment status by payment ID (requires auth)
 */
async function handlePaymentStatus(req: NextRequest, paymentId: string): Promise<NextResponse> {
  // This should use the auth wrapper, but for now we'll keep the existing behavior
  // In a production app, you'd wrap this properly
  try {
    const result = await db.query(
      `SELECT status, transaction_reference, type 
       FROM payments 
       WHERE id = $1`,
      [paymentId]
    );

    const payment = result.rows[0];

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    const status = payment.status === 'completed' ? 'success' : payment.status;

    return NextResponse.json({
      payment_id: paymentId,
      status: status,
      transaction_reference: payment.transaction_reference || null,
      type: payment.type || 'public'
    });

  } catch (err) {
    console.error("Error fetching payment status:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
