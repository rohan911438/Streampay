# Cloak Integration - Implementation Checklist

Use this checklist to verify the Cloak SDK integration is properly set up and ready for use.

## Pre-Implementation Review

- [ ] Read `CLOAK_QUICK_START.md` for overview
- [ ] Reviewed architecture in `CLOAK_INTEGRATION_SUMMARY.md`
- [ ] Understand private transfer flow
- [ ] Have Solana wallet with test USDC (if testing on mainnet)
- [ ] Database credentials ready

## Installation & Setup

### Dependencies
- [ ] Installed `@cloak-xyz/solana` in `packages/solana`
- [ ] Installed `@solana/spl-token` in `packages/solana`
- [ ] Run `npm install` in workspace root
- [ ] Verify no installation errors

### Environment Configuration
- [ ] Added `SOLANA_RPC_URL` to `.env.local`
  - [ ] Testnet: `https://api.testnet.solana.com`
  - [ ] Mainnet: `https://api.mainnet-beta.solana.com`
- [ ] Added `USDC_MINT_ADDRESS` 
  - [ ] Testnet: Get from Solana docs
  - [ ] Mainnet: `EPjFWdd5Au17i3ANF1qLFbgcCzKxwKnhNzrGg44oMWRM`
- [ ] Verified environment variables are accessible

### Database Setup
- [ ] Ran migration: `psql $DATABASE_URL < db/003_private_transactions.sql`
- [ ] Verified `private_transactions` table exists:
  ```sql
  SELECT * FROM information_schema.tables 
  WHERE table_name = 'private_transactions';
  ```
- [ ] Verified indexes created:
  ```sql
  SELECT indexname FROM pg_indexes 
  WHERE tablename = 'private_transactions';
  ```
- [ ] Can insert test record:
  ```sql
  INSERT INTO private_transactions (...) VALUES (...);
  ```

## Code Structure Verification

### Service Layer
- [ ] File exists: `packages/solana/src/cloak.ts`
- [ ] Contains `CloakService` class
- [ ] Contains `initializeCloakService()` function
- [ ] Contains `getCloakService()` function
- [ ] Exported from `packages/solana/src/index.ts`
- [ ] Can import: `import { getCloakService } from "@paystream/solana"`

### API Endpoints
- [ ] File exists: `apps/web/app/api/cloak/private-transfer/route.ts`
- [ ] Exports `POST` handler
- [ ] Exports `GET` handler
- [ ] POST route accessible: `POST /api/cloak/private-transfer`
- [ ] GET route accessible: `GET /api/cloak/private-transfer`
- [ ] Request validation implemented
- [ ] Error handling implemented

### Utilities
- [ ] File exists: `apps/web/lib/cloak-utils.ts`
- [ ] Contains `initiatePrivateTransfer()`
- [ ] Contains `pollTransactionConfirmation()`
- [ ] Contains `usdcToBaseUnits()`
- [ ] Contains `isValidSolanaAddress()`
- [ ] All functions properly typed

### Subscription Integration
- [ ] File exists: `apps/web/lib/cloak-subscription-integration.ts`
- [ ] Contains `processPrivateSubscriptionPayment()`
- [ ] Contains `confirmPendingSubscriptionPayments()`
- [ ] Can import and use functions

## Type Safety

- [ ] No TypeScript errors: `npm run build` in web app
- [ ] Types properly exported from `@paystream/solana`
- [ ] API endpoint properly typed
- [ ] Request/response interfaces defined
- [ ] Error types handled

## API Endpoint Testing

### POST /api/cloak/private-transfer

**Test with curl**:
```bash
curl -X POST http://localhost:3000/api/cloak/private-transfer \
  -H "Content-Type: application/json" \
  -d '{
    "senderPrivateKey": "base64-key",
    "recipientAddress": "recipient-wallet",
    "amountUsdc": 100.50,
    "userId": "user-uuid",
    "metadata": {"description": "Test"}
  }'
```

- [ ] Returns 201 on success
- [ ] Returns 400 on validation error
- [ ] Returns 500 on execution error
- [ ] Response contains `transactionSignature`
- [ ] Response contains `transactionReference`
- [ ] Transaction stored in database

### GET /api/cloak/private-transfer

**Test with curl**:
```bash
curl "http://localhost:3000/api/cloak/private-transfer?transactionSignature=abc123..."
```

- [ ] Returns 200 on found
- [ ] Returns 404 if not found
- [ ] Response contains transaction status
- [ ] Response contains confirmation count
- [ ] Matches database record

## Database Verification

```sql
-- Check table structure
\d private_transactions

-- Check records inserted
SELECT COUNT(*) FROM private_transactions;

-- Test foreign key constraints
SELECT * FROM private_transactions 
WHERE user_id = 'test-uuid' AND subscription_id IS NULL;

-- Check indexes
SELECT * FROM pg_stat_user_indexes 
WHERE relname = 'private_transactions';
```

- [ ] All columns present and correct type
- [ ] Foreign keys working
- [ ] Indexes created
- [ ] Can query records
- [ ] Data persistence verified

## Security Checks

### Authentication
- [ ] Verify API requires proper authentication (if applicable)
- [ ] Check rate limiting implemented
- [ ] Verify HTTPS enforced (production)

### Private Key Handling
- [ ] Private keys never logged
- [ ] Private keys only accepted via base64
- [ ] Private keys not stored in database
- [ ] Private keys not sent in responses

### Input Validation
- [ ] Amount validation (> 0)
- [ ] Address validation (Solana format)
- [ ] Private key validation (64 bytes)
- [ ] SQL injection prevention
- [ ] XSS prevention

### Error Handling
- [ ] Sensitive errors not exposed
- [ ] Generic error messages returned
- [ ] Detailed errors logged server-side
- [ ] Error tracking implemented

## Integration with Subscriptions

- [ ] `cloak-subscription-integration.ts` can be imported
- [ ] `processPrivateSubscriptionPayment()` works
- [ ] Subscription events recorded correctly
- [ ] Next billing date updated on success
- [ ] Failed payments recorded

## Client-Side Usage

### Direct Function Calls
- [ ] Can import `initiatePrivateTransfer`
- [ ] Can import `pollTransactionConfirmation`
- [ ] Can import utility functions
- [ ] Functions have proper TypeScript types

### Example Usage
```typescript
import { initiatePrivateTransfer } from "@/lib/cloak-utils";

const result = await initiatePrivateTransfer({
  senderPrivateKey: "base64-key",
  recipientAddress: "wallet",
  amountUsdc: 100,
  userId: "user-uuid"
});
```

- [ ] Works without errors
- [ ] Returns expected result
- [ ] Types are correct

## Performance Testing

### API Response Time
- [ ] POST endpoint responds in < 5 seconds
- [ ] GET endpoint responds in < 1 second
- [ ] No timeout errors

### Database Performance
```sql
-- Check slow queries
SELECT * FROM private_transactions 
WHERE created_at > NOW() - INTERVAL '1 day';
```

- [ ] Queries execute quickly
- [ ] Indexes being used

### Rate Limiting
- [ ] No rate limiting errors under normal load
- [ ] Rate limiting activates under high load (if implemented)

## Documentation Review

- [ ] Read `CLOAK_INTEGRATION.md` completely
- [ ] Read `CLOAK_QUICK_START.md` completely
- [ ] Read `CLOAK_INTEGRATION_SUMMARY.md` completely
- [ ] All examples are clear
- [ ] Documentation is up-to-date

## Monitoring Setup

### Logging
- [ ] Logs record all transfers
- [ ] Error logging implemented
- [ ] Can grep logs for debugging

### Alerting (Optional)
- [ ] Failed transfers trigger alert
- [ ] High error rate monitored
- [ ] Fee spikes monitored

### Metrics (Optional)
- [ ] Track transfer volume
- [ ] Track success rate
- [ ] Track average fee
- [ ] Track confirmation time

## Testing Coverage

### Unit Tests
- [ ] CloakService tests
- [ ] Utility function tests
- [ ] Type tests

### Integration Tests
- [ ] API endpoint tests
- [ ] Database integration tests
- [ ] End-to-end flow tests

### Manual Testing
- [ ] Executed test transfer
- [ ] Verified database record
- [ ] Checked confirmation polling
- [ ] Tested error scenarios

## Documentation Completeness

Files to verify exist and are complete:

- [ ] `CLOAK_INTEGRATION.md` - Comprehensive guide
- [ ] `CLOAK_QUICK_START.md` - Quick reference
- [ ] `CLOAK_INTEGRATION_SUMMARY.md` - Architecture overview
- [ ] `CLOAK_IMPLEMENTATION_CHECKLIST.md` - This file
- [ ] Code comments in `cloak.ts`
- [ ] Code comments in API endpoint
- [ ] Code comments in utilities

## Deployment Preparation

### Pre-Production
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Environment variables configured
- [ ] Database migration applied
- [ ] API endpoints responding
- [ ] Database queries working

### Production Checklist
- [ ] HTTPS enforced
- [ ] Rate limiting enabled
- [ ] Monitoring configured
- [ ] Error tracking enabled
- [ ] Log rotation configured
- [ ] Database backups enabled
- [ ] RPC endpoint redundancy (if needed)
- [ ] Error alerting configured

## Post-Deployment

- [ ] Verify API endpoints responding
- [ ] Check database for records
- [ ] Monitor error logs
- [ ] Monitor transaction volume
- [ ] Monitor success rate
- [ ] Monitor fees
- [ ] Verify confirmations working

## Rollback Plan

- [ ] Can disable Cloak endpoint without breaking other features
- [ ] Database migration is reversible
- [ ] Fallback payment method available
- [ ] Plan for stranded transactions

## Success Criteria

✅ All checkboxes completed means:

1. **Installation** - Cloak SDK properly installed and configured
2. **Database** - Private transactions table created and accessible
3. **API** - Endpoints implemented and responding correctly
4. **Client** - Utilities available for client integration
5. **Subscriptions** - Integration layer working with subscription flow
6. **Security** - Private keys handled securely
7. **Testing** - All functionality tested and verified
8. **Documentation** - Complete guides available
9. **Monitoring** - Logging and tracking in place
10. **Deployment** - Ready for production use

---

**Status**: Ready for implementation
**Version**: 1.0
**Last Updated**: April 28, 2024

If any checklist item fails, refer to the troubleshooting section in `CLOAK_INTEGRATION.md` or the implementation file for that component.
