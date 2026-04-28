/**
 * Utility functions for integrating Cloak private transfers
 * with the StreamPay application
 */

import { PrivateTransferMetadata } from "@paystream/solana";

/**
 * Client-side function to initiate a private transfer
 */
export async function initiatePrivateTransfer({
  senderPrivateKey,
  recipientAddress,
  amountUsdc,
  userId,
  subscriptionId,
  metadata,
}: {
  senderPrivateKey: string; // Base64 encoded
  recipientAddress: string;
  amountUsdc: number;
  userId: string;
  subscriptionId?: string;
  metadata?: PrivateTransferMetadata;
}) {
  try {
    const response = await fetch("/api/cloak/private-transfer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        senderPrivateKey,
        recipientAddress,
        amountUsdc,
        userId,
        subscriptionId,
        metadata,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || "Private transfer failed");
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    throw new Error(
      `Failed to initiate private transfer: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get the status of a private transfer
 */
export async function getPrivateTransferStatus(transactionSignature: string) {
  try {
    const response = await fetch(
      `/api/cloak/private-transfer?transactionSignature=${encodeURIComponent(transactionSignature)}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to get status");
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    throw new Error(
      `Failed to get transfer status: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Convert USDC amount from human-readable to base units
 * 1 USDC = 1,000,000 base units
 */
export function usdcToBaseUnits(amountUsdc: number): number {
  return Math.floor(amountUsdc * 1_000_000);
}

/**
 * Convert USDC amount from base units to human-readable
 */
export function baseUnitsToUsdc(baseUnits: number): number {
  return baseUnits / 1_000_000;
}

/**
 * Encode a private key to base64 (for safe transmission)
 */
export function encodePrivateKey(privateKeyBytes: Uint8Array): string {
  return Buffer.from(privateKeyBytes).toString("base64");
}

/**
 * Decode a base64 private key
 */
export function decodePrivateKey(base64Key: string): Uint8Array {
  return new Uint8Array(Buffer.from(base64Key, "base64"));
}

/**
 * Poll for transaction confirmation with exponential backoff
 */
export async function pollTransactionConfirmation(
  transactionSignature: string,
  maxAttempts: number = 30,
  initialDelayMs: number = 1000
): Promise<{
  confirmed: boolean;
  confirmations: number;
  attempts: number;
}> {
  let attempts = 0;
  let delayMs = initialDelayMs;

  while (attempts < maxAttempts) {
    try {
      const status = await getPrivateTransferStatus(transactionSignature);

      if (status.confirmationStatus === "confirmed" || status.confirmationStatus === "finalized") {
        return {
          confirmed: true,
          confirmations: status.confirmations,
          attempts: attempts + 1,
        };
      }

      attempts++;
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      // Exponential backoff: increase delay by 50% each attempt, max 5 seconds
      delayMs = Math.min(delayMs * 1.5, 5000);
    } catch (error) {
      console.warn(`Attempt ${attempts + 1} failed:`, error);
      attempts++;

      if (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs = Math.min(delayMs * 1.5, 5000);
      }
    }
  }

  return {
    confirmed: false,
    confirmations: 0,
    attempts: maxAttempts,
  };
}

/**
 * Format private transfer metadata for storage
 */
export function formatTransferMetadata(data: Record<string, any>): PrivateTransferMetadata {
  return {
    description: data.description?.toString(),
    orderId: data.orderId?.toString(),
    invoiceId: data.invoiceId?.toString(),
    customField: data.customField?.toString(),
  };
}

/**
 * Validate Solana wallet address
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    // Valid Solana addresses are base58 strings, 32-44 characters
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  } catch {
    return false;
  }
}

/**
 * Create a transfer reference code for user-friendly identification
 */
export function generateTransferReferenceCode(signature: string): string {
  // Take last 12 characters of signature for human readability
  const code = signature.substring(signature.length - 12).toUpperCase();
  return `TX-${code}`;
}
