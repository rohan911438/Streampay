# Cloak SDK Quick Start Guide

## 5-Minute Setup

### 1. Install Cloak SDK

```bash
cd packages/solana
npm install @cloak-xyz/solana @solana/spl-token
```

### 2. Create Environment Variables

```bash
# .env.local
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
USDC_MINT_ADDRESS=EPjFWdd5Au17i3ANF1qLFbgcCzKxwKnhNzrGg44oMWRM
```

### 3. Apply Database Migration

```bash
psql $DATABASE_URL < db/003_private_transactions.sql
```

## Minimal Example

### Execute a Private Transfer

```typescript
import { getCloakService } from "@paystream/solana";

// Get initialized Cloak service
const cloakService = getCloakService();

// Execute private transfer
const result = await cloakService.executePrivateTransfer(
  privateKeyBytes,           // Uint8Array (64 bytes)
  "recipient-wallet-address",
  100.50,                    // USDC amount
  "EPjFWdd5Au17i3ANF1qLFbgcCzKxwKnhNzrGg44oMWRM" // USDC mint
);

console.log("Transfer completed!");
console.log("Signature:", result.transactionSignature);
console.log("Reference:", result.transactionReference);
```

### Use the API Endpoint

```bash
curl -X POST http://localhost:3000/api/cloak/private-transfer \
  -H "Content-Type: application/json" \
  -d '{
    "senderPrivateKey": "base64-encoded-key",
    "recipientAddress": "recipient-wallet",
    "amountUsdc": 100.50,
    "userId": "user-uuid",
    "metadata": {
      "description": "Payment for services",
      "orderId": "order-123"
    }
  }'
```

### Check Transfer Status

```bash
curl "http://localhost:3000/api/cloak/private-transfer?transactionSignature=abc123..."
```

## Client-Side Integration

```typescript
import { 
  initiatePrivateTransfer,
  pollTransactionConfirmation 
} from "@/lib/cloak-utils";

// Execute transfer
const result = await initiatePrivateTransfer({
  senderPrivateKey: "base64-key",
  recipientAddress: "wallet-address",
  amountUsdc: 50.00,
  userId: "user-uuid",
  metadata: { orderId: "order-789" }
});

// Wait for confirmation
const confirmation = await pollTransactionConfirmation(
  result.transactionSignature
);

if (confirmation.confirmed) {
  console.log(`✓ Confirmed with ${confirmation.confirmations} confirmations`);
}
```

## Key Files

| File | Purpose |
|------|---------|
| `packages/solana/src/cloak.ts` | Core service implementation |
| `apps/web/app/api/cloak/private-transfer/route.ts` | API endpoint |
| `apps/web/lib/cloak-utils.ts` | Client-side utilities |
| `db/003_private_transactions.sql` | Database schema |
| `CLOAK_INTEGRATION.md` | Full documentation |

## Database Queries

```sql
-- View all private transfers
SELECT * FROM private_transactions ORDER BY created_at DESC;

-- Find pending transfers
SELECT * FROM private_transactions WHERE status = 'pending';

-- Get transfers for a user
SELECT * FROM private_transactions WHERE user_id = 'user-uuid';

-- Get subscription payment history
SELECT * FROM private_transactions 
WHERE subscription_id = 'sub-uuid' 
ORDER BY created_at DESC;
```

## Common Issues

| Issue | Solution |
|-------|----------|
| "Invalid private key format" | Ensure it's base64-encoded 64-byte array |
| "Insufficient balance" | Check sender's USDC token account |
| "Transaction not confirmed" | Retry with higher priority fee |
| "Network timeout" | Use a different RPC endpoint |

## Next Steps

1. ✅ Install dependencies
2. ✅ Set environment variables
3. ✅ Apply database migration
4. ✅ Test with `/api/cloak/private-transfer` endpoint
5. 📋 Implement in your UI components
6. 📋 Monitor transactions in database
7. 📋 Add error handling and retries

## Support

- **Full Documentation**: See `CLOAK_INTEGRATION.md`
- **Service API**: Check `packages/solana/src/cloak.ts` for all methods
- **Type Definitions**: Import types: `PrivateTransferResult`, `PrivateTransferMetadata`

## Tips

- 💡 Always encode private keys to base64 before sending
- 💡 Use metadata to track payments through your system
- 💡 Poll for confirmation to ensure transaction finality
- 💡 Store `transactionReference` in your database
- 💡 Implement rate limiting on the API endpoint
