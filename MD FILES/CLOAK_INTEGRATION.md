# Cloak SDK Integration - Private Payments for StreamPay

This document describes the Cloak SDK integration for executing private USDC payments on Solana using shielded transactions.

## Overview

The Cloak SDK integration enables StreamPay to process private payments where transaction details (amount, sender, recipient) are hidden on-chain. This is accomplished through Cloak's shielded transfer functionality, which uses zero-knowledge proofs to maintain privacy while ensuring transaction validity.

### Key Features

- **Private USDC Transfers**: Execute shielded token transfers that hide transaction details
- **Subscription Integration**: Link private transfers to subscription payments
- **Transaction Tracking**: Store and retrieve transaction references in the database
- **Transaction Status Monitoring**: Poll for confirmation status and on-chain verification
- **Metadata Support**: Attach optional metadata (invoice IDs, order references, descriptions)

## Architecture

### Service Layer

**File**: `packages/solana/src/cloak.ts`

The `CloakService` class provides:

```typescript
// Initialize service
const cloakService = initializeCloakService({
  rpcUrl: "https://api.mainnet-beta.solana.com",
  commitment: "confirmed"
});

// Execute private transfer
const result = await cloakService.executePrivateTransfer(
  senderPrivateKey,        // Uint8Array (64 bytes)
  recipientAddress,        // Solana wallet address
  amountUsdc,             // Amount in USDC base units (1 USDC = 1,000,000)
  usdcMint,               // USDC mint address (optional)
  metadata                // Optional transfer metadata
);

// Get transaction status
const status = await cloakService.getTransactionStatus(signature);

// Estimate fees
const fee = await cloakService.estimateTransactionFee();
```

### API Endpoint

**File**: `apps/web/app/api/cloak/private-transfer/route.ts`

#### POST /api/cloak/private-transfer

Execute a private USDC transfer.

**Request Body**:
```json
{
  "senderPrivateKey": "base64-encoded-private-key",
  "recipientAddress": "solana-wallet-address",
  "amountUsdc": 100.50,
  "userId": "user-uuid",
  "subscriptionId": "optional-subscription-uuid",
  "usdcMint": "optional-usdc-mint-address",
  "metadata": {
    "description": "Payment for services",
    "orderId": "order-123",
    "invoiceId": "inv-456"
  }
}
```

**Response (Success)**:
```json
{
  "success": true,
  "data": {
    "transactionSignature": "transaction-hash",
    "transactionReference": "base64-encoded-reference",
    "amount": 100.50,
    "status": "confirmed",
    "timestamp": "2024-04-28T...",
    "databaseId": "transaction-uuid"
  }
}
```

**Response (Error)**:
```json
{
  "success": false,
  "error": "Private transfer execution failed",
  "details": "Insufficient balance..."
}
```

#### GET /api/cloak/private-transfer?transactionSignature=...

Get the status of a private transfer.

**Query Parameters**:
- `transactionSignature`: Solana transaction signature

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "transaction-uuid",
    "status": "pending|confirmed|failed",
    "confirmationStatus": "processed|confirmed|finalized",
    "confirmations": 32,
    "slot": 12345678,
    "amount": 100.50,
    "sender": "sender-address",
    "recipient": "recipient-address",
    "transactionSignature": "tx-hash",
    "createdAt": "2024-04-28T...",
    "confirmedAt": "2024-04-28T..."
  }
}
```

### Database Schema

**File**: `db/003_private_transactions.sql`

Tracks all private transfers:

```sql
CREATE TABLE private_transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  subscription_id UUID,
  sender_address TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  amount_usdc NUMERIC(18, 6) NOT NULL,
  transaction_signature TEXT NOT NULL UNIQUE,
  transaction_reference TEXT NOT NULL,
  status TEXT NOT NULL,           -- pending | confirmed | failed
  confirmation_status TEXT,
  confirmations INTEGER,
  slot BIGINT,
  metadata JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
);
```

### Utilities

**File**: `apps/web/lib/cloak-utils.ts`

Convenience functions for integration:

```typescript
// Initiate a transfer from client code
const result = await initiatePrivateTransfer({
  senderPrivateKey: "base64-key",
  recipientAddress: "wallet-address",
  amountUsdc: 100.50,
  userId: "user-uuid",
  subscriptionId: "optional-sub-uuid",
  metadata: { description: "Payment" }
});

// Poll for confirmation
const confirmation = await pollTransactionConfirmation(
  transactionSignature,
  maxAttempts = 30,
  initialDelayMs = 1000
);

// Amount conversions
const baseUnits = usdcToBaseUnits(100.50);    // 100500000
const usdc = baseUnitsToUsdc(100500000);       // 100.50

// Address validation
const isValid = isValidSolanaAddress(address);

// Generate reference codes
const code = generateTransferReferenceCode(signature);  // TX-ABC123...
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd packages/solana
npm install @cloak-xyz/solana @solana/spl-token
```

### 2. Set Environment Variables

Add to `.env.local` or `.env.production`:

```env
# Solana RPC endpoint
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# USDC mint address (mainnet)
USDC_MINT_ADDRESS=EPjFWdd5Au17i3ANF1qLFbgcCzKxwKnhNzrGg44oMWRM

# Optional: Cloak program ID (defaults to mainnet Cloak program)
CLOAK_PROGRAM_ID=CloakV1111111111111111111111111111111111111
```

### 3. Apply Database Migration

```bash
# Connect to your PostgreSQL instance
psql $DATABASE_URL < db/003_private_transactions.sql
```

### 4. Update Dependencies

The `@paystream/solana` package now exports Cloak functionality. Web app can import directly:

```typescript
import { 
  getCloakService, 
  initializeCloakService,
  type PrivateTransferResult 
} from "@paystream/solana";
```

## Usage Examples

### Example 1: Execute Private Payment in API Endpoint

```typescript
// apps/web/app/api/payments/private/route.ts
import { getCloakService } from "@paystream/solana";

export async function POST(req: Request) {
  const { senderPrivateKey, recipientAddress, amountUsdc, userId } = await req.json();

  const cloakService = getCloakService();
  
  const privateKeyBytes = Buffer.from(senderPrivateKey, "base64");
  
  const result = await cloakService.executePrivateTransfer(
    privateKeyBytes,
    recipientAddress,
    amountUsdc
  );

  // Store in database
  await db.insert("private_transactions", {
    user_id: userId,
    sender_address: senderAddress,
    recipient_address: recipientAddress,
    amount_usdc: amountUsdc,
    transaction_signature: result.transactionSignature,
    transaction_reference: result.transactionReference,
    status: result.status
  });

  return NextResponse.json({ success: true, data: result });
}
```

### Example 2: Client-side Transfer Initiation

```typescript
// apps/web/components/payment-form.tsx
import { initiatePrivateTransfer } from "@/lib/cloak-utils";

export function PrivatePaymentForm() {
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await initiatePrivateTransfer({
        senderPrivateKey: privateKeyBase64,
        recipientAddress: recipientWallet,
        amountUsdc: 50.00,
        userId: currentUser.id,
        metadata: { orderId: "order-789" }
      });

      // Wait for confirmation
      const confirmation = await pollTransactionConfirmation(
        result.transactionSignature
      );

      if (confirmation.confirmed) {
        console.log("Payment confirmed!");
      }
    } catch (error) {
      console.error("Payment failed:", error);
    }
  };
}
```

### Example 3: Track Subscription Payments

```typescript
// Execute private transfer for subscription renewal
const result = await cloakService.executePrivateTransfer(
  senderPrivateKey,
  merchantWallet,
  subscription.plan.priceUsdc,
  undefined, // use default USDC mint
  {
    description: `Subscription renewal: ${subscription.plan.name}`,
    invoiceId: subscription.id,
    orderId: `SUB-${subscription.id}`
  }
);

// Store with subscription reference
await db.insert("private_transactions", {
  user_id: userId,
  subscription_id: subscription.id,
  sender_address,
  recipient_address: merchantWallet,
  amount_usdc: subscription.plan.priceUsdc,
  transaction_signature: result.transactionSignature,
  transaction_reference: result.transactionReference,
  status: result.status,
  metadata: {
    description: `Subscription renewal: ${subscription.plan.name}`,
    invoiceId: subscription.id
  }
});
```

## Security Considerations

### Private Key Handling

⚠️ **CRITICAL**: Never transmit private keys in plain text or store them unencrypted.

**Best Practices**:

1. **Client-side**: Use secure wallets (Phantom, Backpack) instead of handling raw private keys
2. **Server-side**: If you must store keys:
   - Encrypt at rest using `@noble/ciphers` or similar
   - Use environment variables for key material
   - Rotate keys regularly
   - Audit access logs

3. **In Transit**: Always use HTTPS and consider additional encryption layers

### Amount Validation

Always validate amounts before processing:

```typescript
const MIN_AMOUNT = 0.01;  // Minimum 1 cent
const MAX_AMOUNT = 1_000_000; // Maximum 1 million USDC

if (amountUsdc < MIN_AMOUNT || amountUsdc > MAX_AMOUNT) {
  throw new Error("Amount out of allowed range");
}
```

### Rate Limiting

Implement rate limiting on the `/api/cloak/private-transfer` endpoint:

```typescript
import { Ratelimit } from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 h"),
  analytics: true,
  prefix: "ratelimit:cloak-transfer"
});

const { success } = await ratelimit.limit(userId);
if (!success) return NextResponse.json({ error: "Rate limited" }, { status: 429 });
```

## Monitoring and Logging

### Transaction Status Monitoring

Monitor pending transactions and retry failed ones:

```typescript
// Scheduled job to check pending transactions
export async function checkPendingTransactions() {
  const pending = await db.query(
    `SELECT * FROM private_transactions 
     WHERE status = 'pending' 
     AND created_at < NOW() - INTERVAL '5 minutes'`
  );

  for (const tx of pending.rows) {
    const cloakService = getCloakService();
    const status = await cloakService.getTransactionStatus(
      tx.transaction_signature
    );

    if (status.confirmed) {
      await db.update("private_transactions", 
        { id: tx.id },
        { status: "confirmed", confirmations: status.confirmations }
      );
    }
  }
}
```

### Error Handling

All errors are logged with context:

```typescript
try {
  const result = await cloakService.executePrivateTransfer(...);
} catch (error) {
  console.error("[cloak-transfer] Failed", {
    userId,
    amount: amountUsdc,
    recipient: recipientAddress,
    error: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString()
  });
  
  // Store error for analysis
  await db.insert("error_logs", {
    service: "cloak",
    error_type: error instanceof Error ? error.constructor.name : "Unknown",
    message: error instanceof Error ? error.message : String(error),
    context: { userId, amountUsdc }
  });
}
```

## Testing

### Test Private Transfer (Development)

```bash
# Using curl
curl -X POST http://localhost:3000/api/cloak/private-transfer \
  -H "Content-Type: application/json" \
  -d '{
    "senderPrivateKey": "base64-encoded-key",
    "recipientAddress": "recipient-wallet",
    "amountUsdc": 10.00,
    "userId": "test-user-uuid",
    "metadata": { "description": "Test transfer" }
  }'
```

### Integration Tests

```typescript
// tests/cloak-integration.test.ts
import { getCloakService } from "@paystream/solana";

describe("Cloak Private Transfers", () => {
  it("should execute private transfer", async () => {
    const cloakService = getCloakService();
    
    const result = await cloakService.executePrivateTransfer(
      senderPrivateKey,
      recipientAddress,
      10.00
    );

    expect(result.status).toBe("confirmed");
    expect(result.transactionSignature).toBeDefined();
  });

  it("should validate amounts", async () => {
    const cloakService = getCloakService();
    
    await expect(
      cloakService.executePrivateTransfer(
        senderPrivateKey,
        recipientAddress,
        -10.00
      )
    ).rejects.toThrow("Transfer amount must be greater than 0");
  });
});
```

## Troubleshooting

### Issue: "Invalid private key format"

**Solution**: Ensure private key is properly base64-encoded 64-byte array

```typescript
// ✅ Correct
const privateKey = Buffer.from(uint8Array).toString("base64");

// ❌ Incorrect
const privateKey = uint8Array.toString();
```

### Issue: "Insufficient balance"

**Solution**: Check sender's USDC token account has sufficient funds

```typescript
const balance = await connection.getTokenAccountBalance(tokenAccount);
console.log("Available:", balance.value.amount);
```

### Issue: "Transaction not confirmed"

**Solution**: Network may be congested. Increase priority fee and retry

```typescript
const fee = await cloakService.estimateTransactionFee();
console.log("Estimated fee:", fee, "SOL");
```

## Next Steps

1. **Complete Cloak SDK Integration**: The current implementation includes integration points; finalize Cloak SDK API calls
2. **Add Web UI**: Create dashboard components to initiate and track private transfers
3. **Implement Webhooks**: Set up webhooks to confirm payments asynchronously
4. **Add Analytics**: Track private transfer volume, fees, and success rates
5. **Optimize for DevNet/TestNet**: Add configuration for different networks

## References

- [Cloak SDK Documentation](https://docs.cloak.app)
- [Solana Web3.js Documentation](https://docs.solana.com/clients/javascript)
- [SPL Token Program](https://spl.solana.com/token)
- [Zero-Knowledge Proofs in Solana](https://docs.solana.com/features)

## Support

For issues or questions:

1. Check the [Cloak documentation](https://docs.cloak.app)
2. Review [Solana RPC documentation](https://docs.solana.com/api/http)
3. Check application logs: `apps/web/.next/server/logs/`
4. Query database for transaction records: `SELECT * FROM private_transactions WHERE status = 'failed'`
