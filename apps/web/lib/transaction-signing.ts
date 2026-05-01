/**
 * Transaction Signing Utilities for StreamPay
 * 
 * This module provides utilities for the frontend to:
 * 1. Prepare unsigned transactions from the backend
 * 2. Decode base64 transactions
 * 3. Sign transactions using the wallet adapter
 * 4. Submit signed transactions to the network
 * 5. Confirm transactions on-chain
 * 
 * IMPLEMENTATION FLOW:
 * 🟣 STEP 1 — CALL BACKEND (prepare)
 * 🟣 STEP 2 — GET BASE64 TX
 * 🟣 STEP 3 — DECODE (decodeTransaction)
 * 🟣 STEP 4 — SIGN (signTransaction - opens wallet 🔥)
 * 🟣 STEP 5 — ENCODE (encodeTransaction)
 * 🟣 STEP 6 — SEND TX (submitSignedTransaction)
 * 🟣 STEP 7 — CONFIRM (confirmTransaction)
 * 🟣 STEP 8 — SHOW SUCCESS
 */

import { Transaction, PublicKey } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";

/**
 * Error types for better error handling
 */
export class TransactionError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = "TransactionError";
  }
}

/**
 * Response from the prepare endpoint
 */
export interface PrepareTransactionResponse {
  success: boolean;
  transaction: string; // Base64 encoded unsigned transaction
  blockhash: string;
  paymentId: string;
  amount: number;
  walletAddress: string;
  message: string;
}

/**
 * Response from the submit-signed endpoint
 */
export interface SubmitSignedTransactionResponse {
  success: boolean;
  signature: string;
  paymentId: string;
  confirmed: boolean;
  message: string;
  error?: string;
  details?: string;
}

/**
 * STEP 1 & 2: Prepare and fetch unsigned transaction from backend
 */
export async function prepareTransaction(
  walletAddress: string,
  amount: number,
  planId?: string,
  type: string = "private"
): Promise<PrepareTransactionResponse> {
  if (!walletAddress) {
    throw new TransactionError(
      "INVALID_WALLET",
      "Wallet address is required"
    );
  }

  if (!amount || amount <= 0) {
    throw new TransactionError(
      "INVALID_AMOUNT",
      "Amount must be greater than 0"
    );
  }

  try {
    const response = await fetch("/api/payment/prepare", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        walletAddress,
        amount,
        planId,
        type,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new TransactionError(
        "PREPARE_FAILED",
        errorData.error || "Failed to prepare transaction",
        errorData.details
      );
    }

    const data = (await response.json()) as PrepareTransactionResponse;
    return data;
  } catch (error) {
    if (error instanceof TransactionError) {
      throw error;
    }
    throw new TransactionError(
      "NETWORK_ERROR",
      "Failed to prepare transaction",
      error
    );
  }
}

/**
 * STEP 3: Decode base64 transaction to Transaction object
 */
export function decodeTransaction(base64Transaction: string): Transaction {
  try {
    if (!base64Transaction) {
      throw new TransactionError(
        "INVALID_TX",
        "Transaction base64 string is empty"
      );
    }

    const transactionBuffer = Buffer.from(base64Transaction, "base64");
    const transaction = Transaction.from(transactionBuffer);
    return transaction;
  } catch (error) {
    if (error instanceof TransactionError) {
      throw error;
    }
    throw new TransactionError(
      "DECODE_FAILED",
      "Failed to decode transaction",
      error
    );
  }
}

/**
 * STEP 4: Sign transaction using wallet adapter
 * 🔥 THIS IS WHERE PHANTOM WALLET OPENS 🔥
 */
export async function signTransaction(
  transaction: Transaction,
  wallet: WalletContextState
): Promise<Transaction> {
  try {
    // Validate wallet is connected
    if (!wallet.connected || !wallet.publicKey) {
      throw new TransactionError(
        "WALLET_NOT_CONNECTED",
        "Wallet is not connected. Please connect your wallet first."
      );
    }

    // Check if signTransaction method exists
    if (!wallet.signTransaction) {
      throw new TransactionError(
        "WALLET_NO_SIGN",
        "Wallet does not support transaction signing"
      );
    }

    console.log("[TransactionSigning] Opening wallet for signing...");

    // This is where Phantom (or other wallet) opens 🔥
    const signedTransaction = await wallet.signTransaction(transaction);

    console.log("[TransactionSigning] Transaction signed successfully");
    return signedTransaction;
  } catch (error) {
    // Handle wallet rejection specifically
    if (
      error instanceof Error &&
      error.message.includes("User rejected")
    ) {
      throw new TransactionError(
        "WALLET_REJECTED",
        "You rejected the transaction signing request",
        error
      );
    }

    if (error instanceof TransactionError) {
      throw error;
    }

    throw new TransactionError(
      "SIGN_FAILED",
      "Failed to sign transaction",
      error
    );
  }
}

/**
 * STEP 5: Encode signed transaction back to base64
 */
export function encodeTransaction(signedTransaction: Transaction): string {
  try {
    const transactionBuffer = signedTransaction.serialize();
    const base64Transaction = transactionBuffer.toString("base64");
    return base64Transaction;
  } catch (error) {
    throw new TransactionError(
      "ENCODE_FAILED",
      "Failed to encode signed transaction",
      error
    );
  }
}

/**
 * STEP 6 & 7: Submit signed transaction and wait for confirmation
 */
export async function submitSignedTransaction(
  signedTransactionBase64: string,
  paymentId: string
): Promise<SubmitSignedTransactionResponse> {
  try {
    if (!signedTransactionBase64) {
      throw new TransactionError(
        "INVALID_SIGNED_TX",
        "Signed transaction is empty"
      );
    }

    console.log("[TransactionSubmit] Submitting signed transaction to network...");

    const response = await fetch("/api/payment/submit-signed", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        signedTransaction: signedTransactionBase64,
        paymentId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new TransactionError(
        "SUBMIT_FAILED",
        errorData.error || "Failed to submit signed transaction",
        errorData.details
      );
    }

    const data = (await response.json()) as SubmitSignedTransactionResponse;

    console.log(
      "[TransactionSubmit] Transaction submitted with signature:",
      data.signature
    );

    return data;
  } catch (error) {
    if (error instanceof TransactionError) {
      throw error;
    }
    throw new TransactionError(
      "SUBMIT_NETWORK_ERROR",
      "Failed to submit transaction",
      error
    );
  }
}

/**
 * STEP 8: Poll for transaction confirmation
 */
export async function pollTransactionConfirmation(
  signature: string,
  maxAttempts: number = 30,
  initialDelayMs: number = 1000
): Promise<{
  confirmed: boolean;
  signature: string;
  attempts: number;
}> {
  let attempts = 0;
  let delayMs = initialDelayMs;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(
        `/api/payment/status?signature=${encodeURIComponent(signature)}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.confirmed) {
          return {
            confirmed: true,
            signature: signature,
            attempts: attempts + 1,
          };
        }
      }

      attempts++;
      if (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        // Exponential backoff: increase delay by 50% each attempt, max 5 seconds
        delayMs = Math.min(delayMs * 1.5, 5000);
      }
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
    signature: signature,
    attempts: maxAttempts,
  };
}

/**
 * Complete transaction flow: Prepare -> Decode -> Sign -> Encode -> Submit -> Confirm
 * 
 * This is the high-level function that orchestrates the entire signing flow.
 * Use this for a complete end-to-end payment transaction.
 */
export async function executePaymentWithWalletSignature(
  walletAddress: string,
  amount: number,
  wallet: WalletContextState,
  planId?: string,
  type: string = "private"
): Promise<{
  success: boolean;
  signature: string;
  paymentId: string;
  confirmed: boolean;
  message: string;
}> {
  try {
    console.log("[PaymentFlow] Starting payment with wallet signature...");

    // STEP 1 & 2: Prepare and get unsigned transaction
    console.log("[PaymentFlow] Step 1-2: Preparing transaction from backend...");
    const prepareResponse = await prepareTransaction(
      walletAddress,
      amount,
      planId,
      type
    );
    console.log("[PaymentFlow] Transaction prepared:", prepareResponse.paymentId);

    // STEP 3: Decode transaction
    console.log("[PaymentFlow] Step 3: Decoding transaction from base64...");
    const transaction = decodeTransaction(prepareResponse.transaction);
    console.log("[PaymentFlow] Transaction decoded successfully");

    // STEP 4: Sign transaction (opens wallet)
    console.log("[PaymentFlow] Step 4: Signing transaction with wallet...");
    const signedTransaction = await signTransaction(transaction, wallet);
    console.log("[PaymentFlow] Transaction signed successfully");

    // STEP 5: Encode signed transaction
    console.log("[PaymentFlow] Step 5: Encoding signed transaction...");
    const signedTransactionBase64 = encodeTransaction(signedTransaction);
    console.log("[PaymentFlow] Transaction encoded");

    // STEP 6 & 7: Submit and wait for confirmation
    console.log("[PaymentFlow] Step 6-7: Submitting signed transaction...");
    const submitResponse = await submitSignedTransaction(
      signedTransactionBase64,
      prepareResponse.paymentId
    );
    console.log("[PaymentFlow] Transaction submitted:", submitResponse.signature);

    // STEP 8: Poll for confirmation (if not already confirmed)
    let confirmed = submitResponse.confirmed;
    if (!confirmed) {
      console.log("[PaymentFlow] Step 8: Polling for confirmation...");
      const confirmationResult = await pollTransactionConfirmation(
        submitResponse.signature,
        30,
        1000
      );
      confirmed = confirmationResult.confirmed;
    }

    // 🟣 NEW STEP: SYNC WITH BACKEND DB
    console.log("[PaymentFlow] Step 9: Syncing payment with backend database...");
    try {
      await fetch("/api/payment/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txSignature: submitResponse.signature,
          wallet: walletAddress,
          amount: amount,
          referenceId: prepareResponse.paymentId,
          type: type,
          planId: planId
        })
      });
      console.log("[PaymentFlow] Backend sync complete.");
    } catch (syncError) {
      console.warn("[PaymentFlow] Backend sync failed, but transaction is on-chain:", syncError);
    }

    return {
      success: true,
      signature: submitResponse.signature,
      paymentId: submitResponse.paymentId,
      confirmed: confirmed,
      message: confirmed
        ? "✅ Payment successful! Transaction confirmed on-chain and recorded in dashboard."
        : "⏳ Payment sent. Transaction recorded in dashboard and waiting for on-chain confirmation...",
    };
  } catch (error) {
    console.error("[PaymentFlow] Error during payment:", error);

    if (error instanceof TransactionError) {
      throw error;
    }

    throw new TransactionError(
      "PAYMENT_FAILED",
      "Payment execution failed",
      error
    );
  }
}
