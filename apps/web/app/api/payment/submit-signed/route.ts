import { NextRequest, NextResponse } from "next/server";
import { Connection, Transaction } from "@solana/web3.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/payment/submit-signed
 * 
 * Submits a signed transaction to the Solana network.
 * 
 * The frontend has already:
 * 1. Decoded the base64 transaction
 * 2. Signed it using the wallet adapter
 * 3. Serialized it back to base64
 * 
 * This endpoint will:
 * 1. Decode the signed transaction
 * 2. Send it to the Solana network
 * 3. Wait for initial confirmation
 * 4. Return the transaction signature
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { signedTransaction, paymentId } = body;

    if (!signedTransaction) {
      return NextResponse.json(
        { error: "signedTransaction is required" },
        { status: 400 }
      );
    }

    // Initialize Solana connection
    const rpcUrl =
      process.env.RPC_URL ||
      process.env.NEXT_PUBLIC_RPC_URL ||
      process.env.NEXT_PUBLIC_RPC_ENDPOINT ||
      "https://api.devnet.solana.com";
    const connection = new Connection(rpcUrl, "confirmed");

    try {
      // Decode the signed transaction from base64
      const transactionBuffer = Buffer.from(signedTransaction, "base64");
      const transaction = Transaction.from(transactionBuffer);

      // Send the raw transaction
      let signature;
      try {
        signature = await connection.sendRawTransaction(
          transaction.serialize(),
          { 
            skipPreflight: true,
            maxRetries: 3 
          }
        );
      } catch (sendError: any) {
        if (sendError.message && sendError.message.includes('already been processed')) {
          console.log("[PaymentSubmit] Transaction already processed, fetching signature from transaction data");
          // Extract signature from the transaction if already sent
          const bs58 = (await import('bs58')).default;
          signature = bs58.encode(transaction.signatures[0].signature!);
        } else {
          throw sendError;
        }
      }

      console.log(`[PaymentSubmit] Transaction sent successfully: ${signature}`);

      // Return immediately to avoid Vercel serverless timeout (10-15s).
      // The frontend is already configured to poll for confirmation via /api/payment/status.
      return NextResponse.json({
        success: true,
        signature: signature,
        paymentId: paymentId,
        confirmed: false, // Frontend will poll for true
        message: "Transaction submitted to network. Polling for confirmation...",
      });
    } catch (txError) {
      console.error("[PaymentSubmit] Transaction error:", txError);
      return NextResponse.json(
        {
          error: "Failed to process signed transaction",
          details: txError instanceof Error ? txError.message : String(txError),
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("[PaymentSubmit] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to submit transaction",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
