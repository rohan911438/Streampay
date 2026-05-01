import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey, Transaction, TransactionInstruction, SystemProgram } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { jsonDb } from "@/lib/json-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/payment/prepare
 * 
 * Prepares an unsigned transaction for the frontend to sign.
 * The frontend will receive a base64-encoded transaction that it can decode,
 * sign using the wallet adapter, and then send to the network.
 * 
 * This implements the real transaction signing flow as per the requirement:
 * 1. Backend: Prepare unsigned transaction
 * 2. Frontend: Decode from base64
 * 3. Frontend: Sign using wallet adapter
 * 4. Frontend: Send to Solana network
 * 5. Frontend: Confirm transaction
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, amount, planId, type = "private" } = body;

    // Validate inputs
    if (!walletAddress) {
      return NextResponse.json(
        { error: "walletAddress is required" },
        { status: 400 }
      );
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json(
        { error: "amount must be a positive number" },
        { status: 400 }
      );
    }

    // Validate Solana address format
    let recipientPubkey: PublicKey;
    try {
      recipientPubkey = new PublicKey(walletAddress);
    } catch {
      return NextResponse.json(
        { error: "Invalid Solana wallet address" },
        { status: 400 }
      );
    }

    // Get the receiver wallet (for this demo, using a hardcoded treasury)
    // In production, this should be the merchant's wallet
    const treasuryWallet = new PublicKey(
      process.env.NEXT_PUBLIC_TREASURY_WALLET || "11111111111111111111111111111112"
    );

    // Initialize Solana connection
    const rpcUrl =
      process.env.NEXT_PUBLIC_RPC_ENDPOINT ||
      "https://api.devnet.solana.com";
    const connection = new Connection(rpcUrl, "confirmed");

    // Create an unsigned transaction
    // For demo purposes, we'll create a simple transfer instruction
    // In production, this could be a private transfer using Cloak
    const transaction = new Transaction();

    // Add instruction based on transfer type
    if (type === "private") {
      // Simulate MagicBlock/Cloak private execution pipeline instruction
      // Instead of a direct public SystemProgram transfer, we use a Memo program 
      // instruction to act as the shielded transaction payload for the wallet adapter to sign.
      const memoProgramId = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
      const cloakPayload = JSON.stringify({
        protocol: "MagicBlock-v1",
        action: "private_pay",
        amount_usdc: amount,
        merchant: treasuryWallet.toBase58(),
        routing: "shielded"
      });
      
      const instruction = new TransactionInstruction({
        keys: [{ pubkey: recipientPubkey, isSigner: true, isWritable: true }],
        programId: memoProgramId,
        data: Buffer.from(cloakPayload, "utf-8"),
      });
      
      transaction.add(instruction);
    } else {
      // Standard transfer
      const instruction = SystemProgram.transfer({
        fromPubkey: recipientPubkey,
        toPubkey: treasuryWallet,
        lamports: Number(amount) * 1_000_000,
      });
      transaction.add(instruction);
    }

    // Set the fee payer (the user's wallet)
    transaction.feePayer = recipientPubkey;

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = blockhash;

    // Serialize the transaction to base64
    const transactionBuffer = transaction.serialize({
      verifySignatures: false, // Don't verify yet - it's unsigned
      requireAllSignatures: false, // Not all signers are present yet
    });
    const transactionBase64 = transactionBuffer.toString("base64");

    // Create a payment record for tracking
    let paymentId: string;
    try {
      const payment = await jsonDb.createPayment({
        merchantId: "00000000-0000-0000-0000-000000000000", // Demo merchant
        walletAddress: walletAddress,
        amountUsdc: Number(amount),
        planId: planId || null,
        status: "pending",
        type: type,
        provider: "cloak",
        executionLayer: "direct",
        userId: null,
        subscriptionId: null,
        transactionReference: null,
      });
      paymentId = payment.id;
    } catch (error) {
      console.warn("Failed to create payment record:", error);
      paymentId = `temp-${Date.now()}`;
    }

    // Return the unsigned transaction to the frontend
    return NextResponse.json({
      success: true,
      transaction: transactionBase64, // Base64 encoded unsigned transaction
      blockhash: blockhash,
      paymentId: paymentId,
      amount: Number(amount),
      walletAddress: walletAddress,
      message:
        "Unsigned transaction prepared. Sign with your wallet and send to network.",
    });
  } catch (error) {
    console.error("[PaymentPrepare] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to prepare transaction",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
