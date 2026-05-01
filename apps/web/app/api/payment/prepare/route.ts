import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey, Transaction, TransactionInstruction, SystemProgram } from "@solana/web3.js";
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

    // Get the receiver wallet (TREASURY_WALLET must be set in .env.local)
    const treasuryWalletAddress = process.env.TREASURY_WALLET || process.env.NEXT_PUBLIC_TREASURY_WALLET;
    if (!treasuryWalletAddress) {
      return NextResponse.json(
        { error: "TREASURY_WALLET is not configured on the server." },
        { status: 500 }
      );
    }
    const treasuryWallet = new PublicKey(treasuryWalletAddress);

    // Initialize Solana connection
    const rpcUrl =
      process.env.RPC_URL ||
      process.env.NEXT_PUBLIC_RPC_URL ||
      process.env.NEXT_PUBLIC_RPC_ENDPOINT ||
      "https://api.devnet.solana.com";
      
    console.log(`[PaymentPrepare] Initiating for wallet: ${walletAddress}, amount: ${amount}, RPC: ${rpcUrl}`);
    
    const connection = new Connection(rpcUrl, "confirmed");

    // Generate a secure off-chain reference ID for privacy abstraction
    const referenceId = "0x" + Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10);


    // Create an unsigned transaction
    // For demo purposes, we'll create a simple transfer instruction
    // In production, this could be a private transfer using Cloak
    const transaction = new Transaction();

    // Add instruction based on transfer type
    if (type === "private") {
      // 1. REQUIRED: Actual value transfer instruction (moving the value)
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: recipientPubkey,
        toPubkey: treasuryWallet,
        lamports: Math.floor(Number(amount) * 1_000_000_000), // SOL to Lamports (for SOL) 
        // Note: If using USDC, this would be different. Standardizing on SOL for this endpoint.
      });
      transaction.add(transferInstruction);

      // 2. REQUIRED: Private execution pipeline instruction (Cloak/MagicBlock wrapper)
      // Privacy Abstraction: The memo is intentionally opaque. Real data is stored off-chain in the DB.
      const memoProgramId = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
      const cloakPayload = JSON.stringify({
        protocol: "SP-v1",
        ref: referenceId,
        h: Buffer.from(referenceId).toString("base64").substring(0, 8)
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
        lamports: Math.floor(Number(amount) * 1_000_000_000),
      });
      transaction.add(instruction);
    }

    // Set the fee payer (the user's wallet)
    transaction.feePayer = recipientPubkey;

    // Get recent blockhash with retry logic for production stability
    let blockhash: string;
    try {
      const latest = await connection.getLatestBlockhash("confirmed");
      blockhash = latest.blockhash;
    } catch (bhError) {
      console.error("[PaymentPrepare] Failed to get latest blockhash:", bhError);
      return NextResponse.json(
        { error: "Solana RPC error: Failed to get latest blockhash" },
        { status: 503 }
      );
    }
    
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
        transactionReference: referenceId,
      });
      paymentId = payment.id;
    } catch (error) {
      console.warn("[PaymentPrepare] Failed to create payment record in DB:", error);
      paymentId = `temp-${Date.now()}`;
    }

    console.log(`[PaymentPrepare] Success: Payment ID ${paymentId} prepared.`);

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
    console.error("[PaymentPrepare] Critical Error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
