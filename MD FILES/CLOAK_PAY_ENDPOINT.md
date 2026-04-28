# Cloak Pay Endpoint - Implementation Guide

## Overview

The `/api/cloak/pay` endpoint handles private subscription payments using the Cloak SDK. It manages the complete payment flow:

1. User/wallet validation
2. Plan retrieval
3. Subscription creation
4. Private USDC transfer execution
5. Subscription activation
6. Event recording

## Endpoint Details

### POST /api/cloak/pay

Execute a private payment for a subscription plan.

**Request Body**:
```json
{
  "walletAddress": "user-solana-wallet-address",
  "planId": "plan-uuid",
  "senderPrivateKey": "base64-encoded-keypair",
  "amount": 99.99
}
```

**Request Parameters**:
- `walletAddress` (required): User's Solana wallet address
- `planId` (required): UUID of the subscription plan
- `senderPrivateKey` (required): Base64-encoded 64-byte private key
- `amount` (optional): Override plan price (defaults to `plan.price_usdc`)

**Response (Success - 200)**:
```json
{
  "success": true,
  "subscriptionId": "sub-uuid",
  "transactionSignature": "transaction-hash",
  "status": "active",
  "message": "Payment processed successfully. Subscription activated."
}
```

**Response (Payment Failed - 402)**:
```json
{
  "success": false,
  "subscriptionId": "sub-uuid",
  "error": "Payment failed",
  "message": "Error details..."
}
```

**Response (Server Error - 500)**:
```json
{
  "success": false,
  "error": "Internal server error",
  "details": "Error message..."
}
```

**Response (Validation Error - 400)**:
```json
{
  "success": false,
  "error": "walletAddress is required"
}
```

## Data Flow

```
Frontend Request
  ↓
GET /api/cloak/pay
  ├─ Validate inputs (wallet, planId, key)
  ├─ Decode private key (base64 → Uint8Array)
  ├─ Get plan details from DB
  ├─ Get or create user
  ├─ Create subscription (status: pending)
  ├─ Execute private transfer via Cloak
  ├─ Store transaction in private_transactions table
  ├─ Update subscription (status: active)
  ├─ Record subscription_events
  └─ Return success response
```

## Database Operations

The endpoint performs the following database operations:

### 1. Check if User Exists
```sql
SELECT * FROM users WHERE wallet_address = ?;
```
If not found, create new user:
```sql
INSERT INTO users (wallet_address, created_at, updated_at) VALUES (...);
```

### 2. Get Plan Details
```sql
SELECT * FROM plans WHERE id = ? AND is_active = true;
```

### 3. Create Subscription
```sql
INSERT INTO subscriptions 
  (user_id, plan_id, status, start_date, next_billing_date, created_at, updated_at)
VALUES ('pending', ...);
```

### 4. Store Private Transaction
```sql
INSERT INTO private_transactions 
  (user_id, subscription_id, sender_address, recipient_address, amount_usdc,
   transaction_signature, transaction_reference, status, confirmation_status,
   metadata, created_at, updated_at, confirmed_at)
VALUES (...);
```

### 5. Update Subscription to Active
```sql
UPDATE subscriptions SET status = 'active', updated_at = NOW() WHERE id = ?;
```

### 6. Record Payment Event
```sql
INSERT INTO subscription_events 
  (user_id, subscription_id, amount_usdc, event_type, provider_event_id, payload, 
   occurred_at, created_at)
VALUES ('payment_success', ...);
```

On failure, status is set to `canceled` and `payment_failed` event is recorded.

## Usage Examples

### cURL Request
```bash
curl -X POST http://localhost:3000/api/cloak/pay \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "EPjFWdd5Au17i3ANF1qLFbgcCzKxwKnhNzrGg44oMWRM",
    "planId": "12345678-1234-1234-1234-123456789012",
    "senderPrivateKey": "your-base64-encoded-key",
    "amount": 99.99
  }'
```

### TypeScript/JavaScript Client
```typescript
import { initiatePrivateTransfer } from "@/lib/cloak-utils";

const response = await fetch("/api/cloak/pay", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    walletAddress: userWallet,
    planId: plan.id,
    senderPrivateKey: Buffer.from(privateKey).toString("base64"),
    amount: plan.price_usdc
  })
});

const result = await response.json();

if (result.success) {
  console.log("Subscription created:", result.subscriptionId);
  console.log("Transaction:", result.transactionSignature);
} else {
  console.error("Payment failed:", result.message);
}
```

### React Component Example
```typescript
export function SubscriptionCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async (planId: string, walletAddress: string, privateKey: Uint8Array) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/cloak/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          planId,
          senderPrivateKey: Buffer.from(privateKey).toString("base64")
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || result.error);
      }

      // Payment successful
      console.log("✓ Subscription activated:", result.subscriptionId);
      // Redirect to success page
      window.location.href = `/success?subscription=${result.subscriptionId}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => handlePayment(...)} disabled={loading}>
        {loading ? "Processing..." : "Subscribe Now"}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

## Error Handling

The endpoint handles various error scenarios:

### 1. Validation Errors (400)
- Missing required fields
- Invalid wallet address format
- Invalid private key (not 64 bytes)
- Invalid JSON payload

### 2. Not Found Errors (404)
- Plan not found
- Plan is inactive

### 3. Payment Errors (402)
- Insufficient balance
- Network timeout
- Transaction failed

### 4. Server Errors (500)
- Database connection failure
- Unexpected exceptions
- Configuration issues (MERCHANT_WALLET_ADDRESS missing)

All errors are:
- Logged with context (userId, planId, error message)
- Recorded as events in the database
- Returned with appropriate HTTP status codes
- Subscription status updated to `canceled` if payment fails

## Security Considerations

### Private Key Handling
- ✅ Only accepted in base64 format (never raw bytes)
- ✅ Validated to be exactly 64 bytes
- ✅ Never logged or stored
- ✅ Only used for signing transactions
- ❌ NOT stored in database
- ❌ NOT sent in responses

### Transaction Validation
- ✅ Amount validated > 0
- ✅ Plan existence verified before payment
- ✅ User wallet validated
- ✅ Merchant wallet from environment (not user input)

### Rate Limiting
**Recommended**: Implement rate limiting
```typescript
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 h"), // 5 payments per hour
  analytics: true,
  prefix: "ratelimit:cloak-pay"
});

const { success } = await ratelimit.limit(userId);
if (!success) return NextResponse.json({ error: "Rate limited" }, { status: 429 });
```

### HTTPS Only
- Always use HTTPS in production
- Never accept payments over HTTP

## Integration Points

### With Payment Page
```typescript
// pages/checkout.tsx
import { useRouter } from "next/router";

export default function CheckoutPage() {
  const router = useRouter();
  const { planId } = router.query;

  const handlePayment = async (privateKey: Uint8Array) => {
    const response = await fetch("/api/cloak/pay", {
      method: "POST",
      body: JSON.stringify({ planId, senderPrivateKey: toBase64(privateKey) })
    });

    const { subscriptionId } = await response.json();
    router.push(`/subscriptions/${subscriptionId}`);
  };

  return <PaymentForm onSubmit={handlePayment} />;
}
```

### With Wallet Connection
```typescript
// Integrate with @solana/wallet-adapter
import { useWallet } from "@solana/wallet-adapter-react";

const { publicKey, sendTransaction } = useWallet();

const response = await fetch("/api/cloak/pay", {
  method: "POST",
  body: JSON.stringify({
    walletAddress: publicKey?.toString(),
    planId,
    senderPrivateKey: privateKeyOfWallet // from wallet adapter
  })
});
```

## Testing

### Manual Testing
```bash
# 1. Create a test plan (if not exists)
curl -X POST http://localhost:3000/api/plans \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Plan",
    "priceUsdc": 10.00,
    "billingInterval": "monthly"
  }'

# 2. Execute payment
curl -X POST http://localhost:3000/api/cloak/pay \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "EPjFWdd5Au17i3ANF1qLFbgcCzKxwKnhNzrGg44oMWRM",
    "planId": "returned-plan-id",
    "senderPrivateKey": "your-base64-key"
  }'
```

### Database Verification
```sql
-- Check subscription created
SELECT * FROM subscriptions WHERE id = 'subscription-id';

-- Check transaction recorded
SELECT * FROM private_transactions 
WHERE subscription_id = 'subscription-id';

-- Check events
SELECT * FROM subscription_events 
WHERE subscription_id = 'subscription-id'
ORDER BY occurred_at DESC;
```

### Expected Results After Payment
```sql
-- Subscription should be active
SELECT status FROM subscriptions WHERE id = 'sub-id';
-- Result: active

-- Private transaction should be confirmed
SELECT status, confirmation_status FROM private_transactions 
WHERE subscription_id = 'sub-id';
-- Result: confirmed | confirmed

-- Two events should exist
SELECT event_type FROM subscription_events 
WHERE subscription_id = 'sub-id'
ORDER BY occurred_at DESC;
-- Result: payment_success (most recent)
```

## Monitoring

### Logging
The endpoint logs:
- Successful payments: `[pay] Payment processed successfully`
- Failed transfers: `[pay] Transfer failed`
- Unexpected errors: `[pay] Unexpected error`

All logs include context:
```javascript
{
  userId: "uuid",
  subscriptionId: "uuid", 
  planId: "uuid",
  amount: 99.99,
  signature: "tx-hash",
  error: "if applicable"
}
```

### Metrics to Track
- Total payments processed
- Success rate
- Average transaction time
- Error rate by type
- Average amount
- Payment volume over time

### Alerts
Set up alerts for:
- Error rate > 5%
- Payment failures spike
- Response time > 10s
- Missing MERCHANT_WALLET_ADDRESS configuration

## File Reference

- **Endpoint Implementation**: [apps/web/app/api/cloak/pay/route.ts](apps/web/app/api/cloak/pay/route.ts)
- **Service Layer**: [packages/solana/src/cloak.ts](packages/solana/src/cloak.ts)
- **Utilities**: [apps/web/lib/cloak-utils.ts](apps/web/lib/cloak-utils.ts)
- **Database Schema**: [db/003_private_transactions.sql](db/003_private_transactions.sql)
- **Related Endpoint**: [apps/web/app/api/cloak/private-transfer/route.ts](apps/web/app/api/cloak/private-transfer/route.ts)

## Next Steps

1. ✅ Create `/api/cloak/pay` endpoint
2. 📋 Test endpoint locally
3. 📋 Add rate limiting
4. 📋 Create payment UI component
5. 📋 Add webhook for confirmations
6. 📋 Implement subscription renewal logic
7. 📋 Add analytics dashboard

---

**Version**: 1.0  
**Created**: April 28, 2024  
**Status**: Ready for Testing
