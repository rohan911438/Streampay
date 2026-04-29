# StreamPay Payment Router

This folder contains a minimal Anchor program for recording payment intents on chain and confirming off-chain execution.

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

## Playground usage

If you are deploying in Solana Playground, copy the contents of `src/lib.rs` into your Anchor program and keep the account and instruction layout as-is.