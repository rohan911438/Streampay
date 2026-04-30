# StreamPay Payment Router

This folder contains an Anchor program for recording payment intents on chain and confirming off-chain execution.

## Deployment Information

**Status**: ✅ Successfully Deployed to Solana Devnet

### Deployment Details
- **Program ID**: `Bs464Nm3DY6qNafJn5kmVHxh9R8nKRLpuXfdDrZQMd76`
- **Deployment Signature**: `5QV3WoHgcumYgH5brQpBKBdNcfAoeZt2XCofdrJG8y65JxEX8rdhpzGhGeY1usT1eDefzdp4kmpfk1iv5smFfJHy`
- **Timestamp**: Apr 30, 2026 at 10:15:33 India Standard Time
- **Confirmation Status**: Finalized
- **Slot**: 459,045,068
- **Transaction Cost**: 5,390 lamports (~◎0.00001 SOL fee paid)
- **Compute Units**: 2,670 CU

### Verification Transaction
You can verify this deployment on the [Solana Explorer](https://explorer.solana.com/tx/5QV3WoHgcumYgH5brQpBKBdNcfAoeZt2XCofdrJG8y65JxEX8rdhpzGhGeY1usT1eDefzdp4kmpfk1iv5smFfJHy?cluster=devnet):

```
Signature:    5QV3WoHgcumYgH5brQpBKBdNcfAoeZt2XCofdrJG8y65JxEX8rdhpzGhGeY1usT1eDefzdp4kmpfk1iv5smFfJHy
Result:       Success
Confirmation: finalized
Slot:         459,045,068
```

## What it does

- `create_payment` creates a new `PaymentRecord` with status `Pending`.
- `confirm_payment` updates that record to `Completed` and stores an execution reference from Cloak or MagicBlock.
- No price conversion, no cross-chain logic, and no payment execution logic live on chain.

## Account layout

`PaymentRecord` stores:

- user public key
- merchant public key
- amount in lamports
- payment type: `Private` or `Public`
- execution reference string
- timestamp
- status: `Pending` or `Completed`

## Authorization model

`confirm_payment` accepts a signed authority and only allows the user or merchant who owns the record to confirm it.

The program also includes a placeholder backend authority (`BACKEND_AUTHORITY_BYTES`) so you can swap in a real backend wallet pubkey before deploying in Playground.

## Integration

This contract is integrated into StreamPay through:

1. **TypeScript Package**: `packages/solana/src/payment-router.ts` - Provides utilities for interacting with the contract
2. **Constants**: The program ID is exported in `packages/solana/src/constants.ts`
3. **Usage**: Import from `@paystream/solana` package

### Example Usage

```typescript
import { 
  createPaymentRecord, 
  confirmPaymentRecord, 
  PaymentType,
  PAYMENT_ROUTER_PROGRAM_ID 
} from "@paystream/solana";
import { connection } from "@paystream/solana";

// Create a new payment record
const txSignature = await createPaymentRecord(
  connection,
  userKeypair,
  merchantPublicKey,
  amountInLamports,
  PaymentType.Private
);

// Later, confirm the payment with execution reference
const confirmTx = await confirmPaymentRecord(
  connection,
  authorityKeypair,
  paymentRecordPubkey,
  "cloak-transaction-ref-12345"
);
```

## Playground usage

If you are deploying in Solana Playground, copy the contents of `src/lib.rs` into your Anchor program and keep the account and instruction layout as-is.