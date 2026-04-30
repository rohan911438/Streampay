# Real Transaction Signing Flow - Quick Reference Guide

## 📋 Table of Contents
1. [Quick Start](#quick-start)
2. [Step-by-Step Implementation](#step-by-step-implementation)
3. [Code Examples](#code-examples)
4. [Error Handling](#error-handling)
5. [Common Issues](#common-issues)

## Quick Start

### In Your Component

```typescript
import { executePaymentWithWalletSignature, TransactionError } from "@/lib/transaction-signing";
import { useWallet } from "@solana/wallet-adapter-react";

export function MyPaymentComponent() {
  const wallet = useWallet();
  
  async function handlePayment() {
    try {
      const result = await executePaymentWithWalletSignature(
        wallet.publicKey.toBase58(),  // User's wallet address
        10,                            // Amount (USDC)
        wallet,                        // Wallet context
        "plan-123"                     // Optional: Plan ID
      );
      
      console.log("✅ Payment successful:", result.signature);
      // Display success UI
    } catch (error) {
      if (error instanceof TransactionError) {
        console.error("❌", error.code, ":", error.message);
      }
    }
  }
  
  return <button onClick={handlePayment}>Pay Now</button>;
}
```

## Step-by-Step Implementation

### Method 1: Complete Flow (Recommended)

Use `executePaymentWithWalletSignature()` which handles all steps:

```typescript
const result = await executePaymentWithWalletSignature(
  walletAddress,
  amount,
  walletContext,
  planId,
  type  // "private" or "public"
);
```

**Result object:**
```typescript
{
  success: boolean;
  signature: string;          // Transaction signature
  paymentId: string;          // Payment ID from backend
  confirmed: boolean;         // Whether on-chain confirmed
  message: string;            // User-friendly message
}
```

### Method 2: Step-by-Step (Advanced)

For fine-grained control, use individual functions:

```typescript
import {
  prepareTransaction,
  decodeTransaction,
  signTransaction,
  encodeTransaction,
  submitSignedTransaction,
  pollTransactionConfirmation
} from "@/lib/transaction-signing";

// Step 1 & 2: Prepare and get base64 transaction
const prepareResponse = await prepareTransaction(walletAddress, amount);
console.log("📦 Transaction prepared");

// Step 3: Decode from base64
const transaction = decodeTransaction(prepareResponse.transaction);
console.log("📄 Transaction decoded");

// Step 4: Sign (wallet opens here!)
const signedTx = await signTransaction(transaction, wallet);
console.log("✍️ Transaction signed");

// Step 5: Encode back to base64
const signedBase64 = encodeTransaction(signedTx);
console.log("📦 Transaction encoded");

// Step 6 & 7: Submit and get signature
const submitResponse = await submitSignedTransaction(
  signedBase64,
  prepareResponse.paymentId
);
console.log("📤 Transaction submitted:", submitResponse.signature);

// Step 8: Poll for confirmation
const confirmResult = await pollTransactionConfirmation(
  submitResponse.signature,
  30,    // Max attempts
  1000   // Initial delay in ms
);
console.log("✅ Confirmed:", confirmResult.confirmed);
```

## Code Examples

### Example 1: Simple Payment Button

```typescript
"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { executePaymentWithWalletSignature, TransactionError } from "@/lib/transaction-signing";
import { Button } from "@/components/ui/button";

export function SimplePaymentButton() {
  const { connected, publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  
  const handlePay = async () => {
    if (!connected || !publicKey) {
      setError("Please connect wallet first");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const wallet = useWallet(); // Get wallet context
      const result = await executePaymentWithWalletSignature(
        publicKey.toBase58(),
        10,  // $10 USDC
        wallet
      );
      
      setSignature(result.signature);
      alert(`✅ Payment successful!\nSignature: ${result.signature}`);
    } catch (err) {
      if (err instanceof TransactionError) {
        setError(`Error: ${err.message}`);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <WalletMultiButton />
      
      {error && <div className="text-red-600 p-3 bg-red-50 rounded">{error}</div>}
      
      {signature && (
        <div className="text-green-600 p-3 bg-green-50 rounded">
          <p>✅ Payment confirmed!</p>
          <a 
            href={`https://solscan.io/tx/${signature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            View on Solscan →
          </a>
        </div>
      )}
      
      <Button 
        onClick={handlePay}
        disabled={!connected || loading}
      >
        {loading ? "Processing..." : "Pay 10 USDC"}
      </Button>
    </div>
  );
}
```

### Example 2: Subscription with Plan Selection

```typescript
interface Plan {
  id: string;
  name: string;
  price: number;
}

export function SubscriptionPayment({ plans }: { plans: Plan[] }) {
  const { connected, publicKey } = useWallet();
  const wallet = useWallet();
  const [selectedPlan, setSelectedPlan] = useState<Plan>(plans[0]);
  const [status, setStatus] = useState<"idle" | "signing" | "submitting" | "confirming">("idle");
  
  const handleSubscribe = async () => {
    if (!connected || !publicKey) {
      alert("Please connect wallet first");
      return;
    }
    
    try {
      setStatus("signing");
      const result = await executePaymentWithWalletSignature(
        publicKey.toBase58(),
        selectedPlan.price,
        wallet,
        selectedPlan.id
      );
      
      setStatus("confirming");
      
      // Wait a moment for confirmation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (result.confirmed) {
        alert(`✅ Subscribed to ${selectedPlan.name}!`);
      } else {
        alert(`⏳ Subscription pending confirmation. Signature: ${result.signature}`);
      }
    } catch (error) {
      alert(`❌ Subscription failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setStatus("idle");
    }
  };
  
  return (
    <div>
      <div className="space-y-2">
        {plans.map(plan => (
          <label key={plan.id} className="flex items-center">
            <input
              type="radio"
              name="plan"
              value={plan.id}
              checked={selectedPlan.id === plan.id}
              onChange={() => setSelectedPlan(plan)}
            />
            <span className="ml-2">{plan.name} - ${plan.price}/month</span>
          </label>
        ))}
      </div>
      
      <button 
        onClick={handleSubscribe}
        disabled={!connected || status !== "idle"}
      >
        {status === "idle" && "Subscribe Now"}
        {status === "signing" && "Sign in wallet..."}
        {status === "submitting" && "Submitting..."}
        {status === "confirming" && "Confirming..."}
      </button>
    </div>
  );
}
```

### Example 3: Error Handling

```typescript
import { TransactionError } from "@/lib/transaction-signing";

async function handlePaymentWithErrorHandling() {
  try {
    const result = await executePaymentWithWalletSignature(
      walletAddress,
      amount,
      wallet
    );
  } catch (error) {
    if (error instanceof TransactionError) {
      switch (error.code) {
        case "WALLET_REJECTED":
          console.log("User rejected the signing request");
          // Show "cancelled" UI
          break;
          
        case "WALLET_NOT_CONNECTED":
          console.log("Wallet not connected");
          // Prompt to connect wallet
          break;
          
        case "SIGN_FAILED":
          console.log("Signing failed - wallet issue?");
          // Suggest trying again or different wallet
          break;
          
        case "PREPARE_FAILED":
          console.log("Backend error preparing transaction");
          // Retry or contact support
          break;
          
        case "SUBMIT_FAILED":
          console.log("Network error submitting transaction");
          // Retry with backoff
          break;
          
        default:
          console.log("Unknown error:", error.message);
      }
    }
  }
}
```

## Error Handling

### Error Codes Reference

```typescript
// Wallet-related errors
"WALLET_REJECTED"      // User rejected signing
"WALLET_NOT_CONNECTED" // Wallet not connected
"WALLET_NO_SIGN"       // Wallet doesn't support signing

// Input validation errors
"INVALID_WALLET"  // Invalid wallet address
"INVALID_AMOUNT"  // Invalid amount

// Transaction errors
"PREPARE_FAILED"   // Backend failed to prepare transaction
"DECODE_FAILED"    // Failed to decode base64 transaction
"SIGN_FAILED"      // Wallet signing failed
"ENCODE_FAILED"    // Failed to encode signed transaction
"SUBMIT_FAILED"    // Backend failed to submit transaction
"NETWORK_ERROR"    // Network connectivity issue

// Payment flow errors
"PAYMENT_FAILED"   // General payment failure
```

### Best Practices for Error Handling

```typescript
try {
  const result = await executePaymentWithWalletSignature(...);
  
  // Show appropriate UI based on result
  if (result.confirmed) {
    showSuccessUI("Payment confirmed!");
  } else {
    showPendingUI("Waiting for confirmation...");
  }
} catch (error) {
  if (error instanceof TransactionError) {
    // Specific error handling
    if (error.code === "WALLET_REJECTED") {
      showCancelledUI("You cancelled the transaction");
    } else if (error.code.includes("NETWORK")) {
      showRetryUI("Network error - try again");
    } else {
      showErrorUI(`Error: ${error.message}`);
    }
    
    // Log for debugging
    console.error(`[Payment Error] ${error.code}:`, error.details);
  } else {
    // Unexpected error
    showErrorUI("An unexpected error occurred");
    console.error("Unexpected error:", error);
  }
}
```

## Common Issues

### Issue 1: "Wallet is not connected"

**Solution:**
```typescript
if (!wallet.connected || !wallet.publicKey) {
  alert("Please connect your wallet first");
  return;
}
```

### Issue 2: "User rejected the transaction"

**Solution:** This is normal behavior. Let user retry:
```typescript
catch (error) {
  if (error instanceof TransactionError && error.code === "WALLET_REJECTED") {
    // User intentionally cancelled, not an error
    // Just reset UI and allow retry
    setIsSubmitting(false);
  }
}
```

### Issue 3: "Transaction confirmed" not showing

**Reason:** Transaction might still be pending. Use polling:
```typescript
// Manual polling if result.confirmed === false
const confirmationResult = await pollTransactionConfirmation(
  result.signature,
  30,    // Max 30 attempts
  1000   // Check every 1 second
);

if (confirmationResult.confirmed) {
  updateUI("Transaction confirmed!");
}
```

### Issue 4: Transaction fails on-chain

**Debugging:**
```typescript
// Check transaction on Solscan
https://solscan.io/tx/{signature}?cluster=devnet

// Common reasons:
// - Insufficient balance
// - Invalid recipient
// - Program error
// - RPC rate limit
```

### Issue 5: Slow confirmations

**Solution:**
- Use devnet for testing (faster)
- Increase polling attempts
- Check RPC endpoint status
```typescript
// Custom polling with longer timeout
const confirmResult = await pollTransactionConfirmation(
  signature,
  60,    // Up to 60 attempts
  2000   // Check every 2 seconds
);
```

## Debugging Tips

### Enable Console Logging

The implementation logs all steps:

```javascript
// Open browser console (F12)
// Perform a payment
// Check console for logs like:
// [PaymentFlow] Starting payment...
// [PaymentFlow] Step 1-2: Preparing transaction...
// [TransactionSigning] Opening wallet for signing...
```

### Check Backend Logs

```bash
# Terminal where dev server is running
# Look for API endpoint logs:
[PaymentPrepare] Transaction prepared...
[PaymentSubmit] Transaction submitted with signature...
[PaymentSubmit] Transaction confirmed...
```

### Use Solscan Explorer

Verify transactions:
```
https://solscan.io/tx/{signature}?cluster=devnet
```

---

**For more information, see:**
- [Implementation Details](./IMPLEMENTATION_REAL_TRANSACTION_SIGNING.md)
- [Test Suite](./REAL_TRANSACTION_SIGNING_TESTS.js)
