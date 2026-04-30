# StreamPay Subscription Manager

This is an Anchor program for managing subscription lifecycle state on chain.

## Deployment Information

**Status**: ✅ Successfully Deployed to Solana Devnet

### Deployment Details
- **Program ID**: `Bs464Nm3DY6qNafJn5kmVHxh9R8nKRLpuXfdDrZQMd76`
- **Upgrade Signature**: `TzkUpt83SxkEYky7Nz97kKoNaWExTrEW1FTjjksJhmGFhNQbHk2SW2xRH9gk71k84ZekF64cenFibWHJhxSSype`
- **Timestamp**: Apr 30, 2026 at 10:21:46 India Standard Time
- **Confirmation Status**: Finalized
- **Slot**: 459,046,051
- **Transaction Cost**: 4,475 lamports (~◎0.000005 SOL fee paid)
- **Compute Units**: 2,370 CU

### Verification Transaction
You can verify this deployment on the [Solana Explorer](https://explorer.solana.com/tx/TzkUpt83SxkEYky7Nz97kKoNaWExTrEW1FTjjksJhmGFhNQbHk2SW2xRH9gk71k84ZekF64cenFibWHJhxSSype?cluster=devnet):

```
Signature:    TzkUpt83SxkEYky7Nz97kKoNaWExTrEW1FTjjksJhmGFhNQbHk2SW2xRH9gk71k84ZekF64cenFibWHJhxSSype
Result:       Success
Confirmation: finalized
Slot:         459,046,051
```

## Instructions

- `create_subscription_plan` lets a merchant register a plan with `plan_id`, `amount`, and `duration_seconds`.
- `activate_subscription` creates a subscription after a confirmed payment and stores the linked `PaymentRecord` pubkey.
- `renew_subscription` extends the active period after a renewal payment is confirmed.

## Accounts

- `SubscriptionPlan` stores merchant, plan ID, amount, and duration.
- `Subscription` stores user, merchant, plan ID, amount, payment record link, start/end timestamps, and status.
- `PaymentRecord` is included as a minimal reference account for activation and renewal checks.

## Integration

This contract is integrated into StreamPay through:

1. **TypeScript Package**: `packages/solana/src/subscription-manager.ts` - Provides utilities for interacting with the contract
2. **Constants**: The program ID is exported in `packages/solana/src/constants.ts`
3. **Usage**: Import from `@paystream/solana` package

### Example Usage

```typescript
import { 
  createSubscriptionPlan, 
  activateSubscription, 
  renewSubscription,
  SubscriptionStatus,
  SUBSCRIPTION_MANAGER_PROGRAM_ID 
} from "@paystream/solana";
import { connection } from "@paystream/solana";

// Create a new subscription plan
const txSignature = await createSubscriptionPlan(
  connection,
  merchantKeypair,
  planId,
  amountInLamports,
  durationInSeconds
);

// Activate subscription after payment confirmation
const activateTx = await activateSubscription(
  connection,
  authorityKeypair,
  subscriptionPlanPubkey,
  paymentRecordPubkey
);

// Renew subscription for another period
const renewTx = await renewSubscription(
  connection,
  authorityKeypair,
  subscriptionPubkey,
  subscriptionPlanPubkey,
  newPaymentRecordPubkey
);
```

## Notes

- No payment execution, privacy logic, pricing, or cross-chain routing is included here.
- Works seamlessly with the Payment Router contract for recording payment intents.
- Supports user, merchant, or backend authority for subscription operations.