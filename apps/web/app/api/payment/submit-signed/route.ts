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
          { skipPreflight: true }
        );
      } catch (sendError: any) {
        if (sendError.message && sendError.message.includes('already been processed')) {
          console.log("[PaymentSubmit] Transaction already processed, proceeding with confirmation check");
          const bs58 = require('bs58');
          const encodeFn = bs58.default ? bs58.default.encode : bs58.encode;
          signature = encodeFn(transaction.signatures[0].signature);
        } else {
          throw sendError;
        }
      }

      console.log(`[PaymentSubmit] Transaction sent with signature: ${signature}`);

      // Wait for initial confirmation (up to 30 seconds)
      try {
        const confirmation = await connection.confirmTransaction(signature, "confirmed");
        console.log(`[PaymentSubmit] Transaction confirmed:`, confirmation);

        if (confirmation.value.err) {
          return NextResponse.json(
            {
              success: false,
              error: "Transaction failed on-chain",
              signature: signature,
              paymentId: paymentId,
              details: confirmation.value.err.toString(),
            },
            { status: 402 }
          );
        }

        return NextResponse.json({
          success: true,
          signature: signature,
          paymentId: paymentId,
          confirmed: true,
          message: "Transaction successfully signed and submitted to the network",
        });
      } catch (confirmError) {
        // Transaction was sent but confirmation timed out
        // This might be okay - the transaction could still be pending
        console.warn(`[PaymentSubmit] Confirmation timeout:`, confirmError);

        return NextResponse.json({
          success: true,
          signature: signature,
          paymentId: paymentId,
          confirmed: false,
          message:
            "Transaction sent but confirmation is pending. Check the signature in the Solana explorer.",
        });
      }
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
