import { NextResponse } from "next/server";
import { getCloakService, PrivateTransferMetadata } from "@paystream/solana";
import { db } from "@paystream/db";
import { Keypair } from "@solana/web3.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Request body for private transfer
 */
interface PrivateTransferRequestBody {
  senderPrivateKey: string; // Base64 encoded private key
  recipientAddress: string;
  amountUsdc: number;
  userId: string; // UUID of the user making the transfer
  subscriptionId?: string; // Optional UUID for subscription context
  usdcMint?: string; // Optional, defaults to mainnet USDC
  metadata?: PrivateTransferMetadata;
}

/**
 * Validate request body
 */
function validateRequest(body: unknown): body is PrivateTransferRequestBody {
  if (typeof body !== "object" || body === null) {
    return false;
  }

  const b = body as Record<string, unknown>;

  return (
    typeof b.senderPrivateKey === "string" &&
    typeof b.recipientAddress === "string" &&
    typeof b.amountUsdc === "number" &&
    typeof b.userId === "string" &&
    (b.subscriptionId === undefined || typeof b.subscriptionId === "string") &&
    (b.usdcMint === undefined || typeof b.usdcMint === "string") &&
    (b.metadata === undefined || typeof b.metadata === "object")
  );
}

/**
 * Helper to decode base64 private key
 */
function decodePrivateKey(base64Key: string): Uint8Array {
  try {
    const buffer = Buffer.from(base64Key, "base64");
    if (buffer.length !== 64) {
      throw new Error("Private key must be 64 bytes");
    }
    return new Uint8Array(buffer);
  } catch (error) {
    throw new Error(`Invalid private key format: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * POST /api/cloak/private-transfer
 *
 * Execute a private USDC transfer using Cloak's shielded transaction
 *
 * Request body:
 * {
 *   "senderPrivateKey": "base64-encoded-private-key",
 *   "recipientAddress": "recipient-solana-address",
 *   "amountUsdc": 100.50,
 *   "userId": "user-uuid",
 *   "subscriptionId": "optional-subscription-uuid",
 *   "usdcMint": "optional-usdc-mint-address",
 *   "metadata": {
 *     "description": "Payment for services",
 *     "orderId": "order-123"
 *   }
 * }
 *
 * Returns:
 * {
 *   "success": true,
 *   "transactionSignature": "transaction-hash",
 *   "transactionReference": "base64-encoded-reference",
 *   "amount": 100.50,
 *   "status": "confirmed",
 *   "timestamp": "2024-04-28T..."
 * }
 */
export async function POST(req: Request) {
  try {
    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // Validate request body
    if (!validateRequest(body)) {
      return NextResponse.json(
        {
          error: "Invalid request body. Required fields: senderPrivateKey, recipientAddress, amountUsdc, userId",
        },
        { status: 400 }
      );
    }

    const {
      senderPrivateKey,
      recipientAddress,
      amountUsdc,
      userId,
      subscriptionId,
      usdcMint,
      metadata,
    } = body;

    // Validate amount
    if (amountUsdc <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Decode private key
    let privateKeyBytes: Uint8Array;
    try {
      privateKeyBytes = decodePrivateKey(senderPrivateKey);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid private key" },
        { status: 400 }
      );
    }

    // Initialize Cloak service
    const cloakService = getCloakService();

    // Execute private transfer
    const transferResult = await cloakService.executePrivateTransfer(
      privateKeyBytes,
      recipientAddress,
      amountUsdc,
      usdcMint,
      metadata
    );

    // Store transaction in database
    const txRecord = await db.insert(
      "private_transactions",
      {
        user_id: userId,
        subscription_id: subscriptionId || null,
        sender_address: Keypair.fromSecretKey(privateKeyBytes).publicKey.toString(),
        recipient_address: recipientAddress,
        amount_usdc: amountUsdc,
        transaction_signature: transferResult.transactionSignature,
        transaction_reference: transferResult.transactionReference,
        status: transferResult.status,
        metadata: metadata ? JSON.stringify(metadata) : null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      "*"
    );

    if (!txRecord?.id) {
      console.error("[private-transfer] Failed to store transaction record");
      return NextResponse.json(
        {
          success: false,
          error: "Failed to store transaction record",
        },
        { status: 500 }
      );
    }

    console.log("[private-transfer] Successfully completed transfer", {
      userId,
      amount: amountUsdc,
      recipient: recipientAddress,
      signature: transferResult.transactionSignature,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          transactionSignature: transferResult.transactionSignature,
          transactionReference: transferResult.transactionReference,
          amount: transferResult.amount,
          status: transferResult.status,
          timestamp: transferResult.timestamp.toISOString(),
          databaseId: txRecord.id,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[private-transfer] failed:", errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: "Private transfer execution failed",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cloak/private-transfer?transactionSignature=...
 *
 * Get the status of a private transfer
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const transactionSignature = searchParams.get("transactionSignature");

    if (!transactionSignature) {
      return NextResponse.json(
        { error: "transactionSignature query parameter is required" },
        { status: 400 }
      );
    }

    const cloakService = getCloakService();

    // Get transaction status
    const txStatus = await cloakService.getTransactionStatus(transactionSignature);

    // Query database for transaction record
    const result = await db.query(
      'SELECT * FROM private_transactions WHERE transaction_signature = $1',
      [transactionSignature]
    );

    const txRecord = result.rows[0];

    if (!txRecord) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: txRecord.id,
          status: txRecord.status,
          confirmationStatus: txStatus.confirmed ? "confirmed" : "pending",
          confirmations: txStatus.confirmations,
          slot: txStatus.slot,
          amount: txRecord.amount_usdc,
          sender: txRecord.sender_address,
          recipient: txRecord.recipient_address,
          transactionSignature: txRecord.transaction_signature,
          createdAt: txRecord.created_at,
          confirmedAt: txRecord.confirmed_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[private-transfer-status] failed:", errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get transaction status",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
