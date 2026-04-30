# Real Transaction Signing Flow - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React/Next.js)                    │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │             Payment Component (payment-prep.tsx)            │   │
│  │                                                             │   │
│  │  1. Validate Wallet Connection                            │   │
│  │  2. Display Payment Options (Private/Public)              │   │
│  │  3. Handle "Private Pay" Button Click                     │   │
│  │  4. Orchestrate Complete Signing Flow                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │      Transaction Signing Utilities (transaction-signing.ts)│   │
│  │                                                             │   │
│  │  • prepareTransaction()                                   │   │
│  │  • decodeTransaction()                                    │   │
│  │  • signTransaction() ← Connects to wallet                 │   │
│  │  • encodeTransaction()                                    │   │
│  │  • submitSignedTransaction()                              │   │
│  │  • pollTransactionConfirmation()                          │   │
│  │  • executePaymentWithWalletSignature()                    │   │
│  │                                                             │   │
│  │  Error Handling: TransactionError with specific codes     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
└──────────────────────────────┼───────────────────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
    ┌─────────┐          ┌──────────┐         ┌──────────────┐
    │ Backend │          │ Phantom  │         │ Solana RPC   │
    │ API     │          │ Wallet   │         │              │
    │         │          │          │         │ (Network)    │
    └────┬────┘          └────┬─────┘         └──────┬───────┘
         │                    │                      │
         ▼                    ▼                      │
    ┌────────────────────────────────────────────────┼─────┐
    │              REQUEST/RESPONSE FLOW              │     │
    │                                                 │     │
    │  1. POST /api/payment/prepare                 │     │
    │     ↓ Unsigned TX (base64)                    │     │
    │                                                 │     │
    │  2. DECODE on frontend                        │     │
    │     ↓ Transaction object                      │     │
    │                                                 │     │
    │  3. wallet.signTransaction()                  │     │
    │     🔥 Phantom Opens (User Signs) 🔥          │     │
    │     ↓ Signed TX object                        │     │
    │                                                 │     │
    │  4. ENCODE on frontend                        │     │
    │     ↓ Signed TX (base64)                      │     │
    │                                                 │     │
    │  5. POST /api/payment/submit-signed           │     │
    │     ↓ Broadcast to network                    │────────────┐
    │     ↓ Signature returned                           │     │
    │                                                 │     │
    │  6. GET /api/payment/status?sig=...           │     │
    │     Poll every 1-5 seconds                    │     │
    │     ↓ Confirmation status                     │     │
    │                                                 │     │
    │  7. Display Success/Failure                   │     │
    │     Show signature + link to Solscan          │     │
    │                                                 │     │
    └────────────────────────────────────────────────┼─────┘
                                                      │
                                                      ▼
                                            ┌──────────────────┐
                                            │  Solana Network  │
                                            │  (Devnet/Testnet)│
                                            │  or (Mainnet)    │
                                            │                  │
                                            │ Transaction:     │
                                            │ • Signed         │
                                            │ • Confirmed      │
                                            │ • Finalized      │
                                            └──────────────────┘
```

## Component Interaction Flow

```
┌───────────────────────────────────────────────────────────────────┐
│ 1. INITIALIZATION                                                  │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  User Opens Payment Page                                         │
│         │                                                        │
│         ▼                                                        │
│  WalletMultiButton Component                                    │
│  ├─ Detects installed wallets (Phantom, etc.)                  │
│  └─ User clicks "Connect Wallet"                               │
│         │                                                        │
│         ▼                                                        │
│  Wallet Connects                                                │
│  ├─ publicKey available                                         │
│  ├─ signTransaction method available                            │
│  └─ Component state updated                                     │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│ 2. PAYMENT INITIATION                                              │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  User Clicks "Secure Checkout" Button                            │
│         │                                                        │
│         ▼                                                        │
│  onPrivatePaymentClick()                                        │
│  ├─ Check wallet.connected ✓                                   │
│  ├─ Check wallet.publicKey ✓                                   │
│  ├─ Check wallet.signTransaction exists ✓                      │
│  │                                                              │
│  ├─ Call executePaymentWithWalletSignature()                   │
│  │         │                                                   │
│  │         ▼                                                   │
│  │   [Complete Signing Flow Begins]                           │
│  │         │                                                   │
│  └─ State: isPrivateSubmitting = true                         │
│                                                                │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│ 3. PREPARE TRANSACTION                                             │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  prepareTransaction(walletAddress, amount, planId, type)         │
│         │                                                        │
│         ▼                                                        │
│  POST /api/payment/prepare                                      │
│  └─ Backend creates unsigned TX                                │
│     ├─ Creates transfer instruction                            │
│     ├─ Sets fee payer to user wallet                           │
│     ├─ Gets recent blockhash                                   │
│     ├─ Creates payment record                                  │
│     └─ Returns base64 encoded TX                               │
│         │                                                       │
│         ▼                                                       │
│  Response: {                                                    │
│    transaction: "base64...",                                   │
│    blockhash: "...",                                           │
│    paymentId: "...",                                           │
│    amount: 10                                                  │
│  }                                                              │
│                                                                │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│ 4. DECODE TRANSACTION                                              │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  decodeTransaction(base64Transaction)                            │
│         │                                                        │
│         ▼                                                        │
│  Buffer.from(base64, "base64")                                 │
│  Transaction.from(buffer)                                      │
│         │                                                       │
│         ▼                                                       │
│  Transaction {                                                 │
│    instructions: [TransferInstruction],                        │
│    feePayer: PublicKey,                                        │
│    recentBlockhash: string,                                    │
│    signatures: []                                              │
│  }                                                              │
│                                                                │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│ 5. SIGN WITH WALLET 🔥 CRITICAL STEP 🔥                            │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  signTransaction(transaction, wallet)                           │
│         │                                                       │
│         ▼                                                       │
│  wallet.signTransaction(transaction)                           │
│  🔥 PHANTOM WALLET OPENS 🔥                                    │
│         │                                                       │
│    ┌────┴────┐                                                 │
│    │ User    │                                                 │
│    │ Action  │                                                 │
│    └────┬────┘                                                 │
│         │                                                      │
│    ┌────┴──────────────────────┐                              │
│    │                           │                              │
│  APPROVE                     REJECT                          │
│    │                           │                              │
│    ▼                           ▼                              │
│ Signed TX              TransactionError                      │
│ returned         (code: WALLET_REJECTED)                    │
│    │                           │                              │
│    └───────────┬───────────────┘                              │
│                │                                              │
│                ▼                                              │
│  Signed Transaction {                                        │
│    ...transaction                                            │
│    signatures: [{                                            │
│      publicKey: userPubkey,                                  │
│      signature: Uint8Array(64 bytes)                         │
│    }]                                                         │
│  }                                                            │
│                                                              │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│ 6. ENCODE SIGNED TRANSACTION                                       │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  encodeTransaction(signedTransaction)                           │
│         │                                                       │
│         ▼                                                       │
│  signedTx.serialize()                                          │
│  buffer.toString("base64")                                     │
│         │                                                      │
│         ▼                                                      │
│  "AgblZ3Bh...base64string..."                                 │
│                                                               │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│ 7. SUBMIT SIGNED TRANSACTION                                       │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  submitSignedTransaction(base64SignedTx, paymentId)             │
│         │                                                        │
│         ▼                                                        │
│  POST /api/payment/submit-signed                               │
│  └─ Backend receives signed TX                                 │
│     ├─ Decode base64 → buffer → Transaction                   │
│     ├─ Validate signatures                                     │
│     ├─ connection.sendRawTransaction(serialized)              │
│     │  │                                                       │
│     │  ▼ [BROADCAST TO SOLANA NETWORK]                         │
│     │                                                          │
│     ├─ Wait for initial confirmation                          │
│     ├─ Return signature (if sent)                             │
│     └─ Return confirmation status                             │
│         │                                                      │
│         ▼                                                      │
│  Response: {                                                   │
│    signature: "5tZsG8j...",                                    │
│    confirmed: true/false,                                      │
│    message: "Transaction sent..."                             │
│  }                                                             │
│                                                                │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│ 8. POLL FOR CONFIRMATION                                           │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  pollTransactionConfirmation(signature, maxAttempts=30)         │
│         │                                                        │
│         ▼                                                        │
│  Loop: Do 30 times {                                            │
│    GET /api/payment/status?signature=...                        │
│      ├─ connection.getSignatureStatus(signature)              │
│      └─ Return: { confirmed, confirmations, status }          │
│         │                                                      │
│         ▼                                                      │
│    IF confirmed THEN                                           │
│      └─ Break loop, return {confirmed: true}                  │
│    ELSE                                                        │
│      └─ Wait 1-5 seconds (exponential backoff)                │
│      └─ Retry                                                 │
│  }                                                              │
│         │                                                      │
│         ▼                                                      │
│  Result: {                                                     │
│    confirmed: boolean,                                         │
│    signature: string,                                          │
│    attempts: number                                            │
│  }                                                             │
│                                                                │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│ 9. DISPLAY RESULT                                                  │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  IF success AND confirmed:                                       │
│    ├─ setPaymentSuccess(true)                                  │
│    ├─ Show GREEN success card "Payment Confirmed"              │
│    ├─ Display signature (clickable → Solscan)                  │
│    ├─ Display payment ID                                       │
│    └─ Show "Go to Dashboard" button                            │
│                                                                 │
│  IF success AND NOT confirmed:                                  │
│    ├─ setPaymentSuccess(true)                                  │
│    ├─ Show BLUE card "Payment Submitted"                       │
│    ├─ Display signature with "Pending" badge                   │
│    ├─ Message: "Waiting for confirmation"                      │
│    └─ Auto-refresh in background                               │
│                                                                 │
│  IF error:                                                      │
│    ├─ setActionError(message)                                  │
│    ├─ Show RED error alert                                     │
│    ├─ Display specific error code                              │
│    ├─ Suggest recovery action                                  │
│    └─ Allow user to retry                                      │
│                                                                 │
└───────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
executePaymentWithWalletSignature()
         │
    ┌────┴──────────────────────────────────────────┐
    │                                               │
    ▼                                               ▼
SUCCESS                                          ERROR
    │                                               │
    ├─ prepareTransaction()                    ├─ PREPARE_FAILED
    │  └─ network/backend error                │
    │                                               │
    ├─ decodeTransaction()                      ├─ DECODE_FAILED
    │  └─ invalid base64/buffer                 │
    │                                               │
    ├─ signTransaction()                        ├─ WALLET_REJECTED ✓
    │  ├─ WALLET_NOT_CONNECTED              ├─ WALLET_NOT_CONNECTED ✓
    │  ├─ WALLET_NO_SIGN                    ├─ SIGN_FAILED
    │  └─ User approves                        │
    │                                               │
    ├─ encodeTransaction()                      ├─ ENCODE_FAILED
    │  └─ encoding error                        │
    │                                               │
    ├─ submitSignedTransaction()                ├─ SUBMIT_FAILED
    │  └─ network/backend error                │
    │                                               │
    ├─ pollTransactionConfirmation()            ├─ (timeout ok)
    │  └─ returns confirmed status              │
    │                                               │
    └─ Return {                                └─ Throw TransactionError
         success: true,                           with code
         signature: "...",                        └─ Component catches
         paymentId: "...",                           └─ Shows error UI
         confirmed: boolean,                          └─ Allows retry
         message: "..."
       }
```

## State Machine Diagram

```
                    ┌─────────────────────────────────────┐
                    │         INITIAL STATE               │
                    │  - paymentSuccess = false           │
                    │  - actionError = null               │
                    │  - isPrivateSubmitting = false      │
                    └────────────┬────────────────────────┘
                                 │
                    User clicks "Secure Checkout"
                                 │
                                 ▼
                    ┌─────────────────────────────────────┐
                    │      SIGNING IN PROGRESS            │
                    │  - isPrivateSubmitting = true       │
                    │  - Show: "Executing Transfer..."    │
                    │  - Wallet opens                     │
                    └────┬────────────────────┬───────────┘
                         │                    │
                     User Approves        User Rejects
                         │                    │
                         ▼                    ▼
            ┌──────────────────────┐  ┌────────────────────┐
            │  SUBMITTED STATE     │  │   ERROR STATE      │
            │ - Signature sent     │  │ - actionError set  │
            │ - Polling confirm    │  │ - Show error UI    │
            │ - Show blue card     │  │ - Allow retry      │
            │   "Submitted"        │  └─────┬──────────────┘
            └────┬─────────────────┘        │
                 │                          │
         ┌───────┴────────┐                 │
         │                │                 │
    Confirmed        Not Confirmed       User Clicks
         │          (still pending)        Retry
         │                │                 │
         ▼                ▼                 │
    ┌──────────┐    ┌──────────────┐       │
    │ CONFIRMED│    │ PENDING      │       │
    │          │    │ (blue UI)    │       │
    │Show:     │    │              │◄──────┘
    │✅ Green  │    │Auto-refresh  │
    │  Card    │    │Every 2 sec   │
    │SUCCESS   │    │(Max 30 times)│
    │          │    │              │
    └──────────┘    └──────┬───────┘
         │                 │
         │         Confirmation received
         │                 │
         │                 ▼
         │            ┌──────────┐
         │            │ CONFIRMED│
         │            │ (switch  │
         │            │  to green│
         │            │   card)  │
         │            └──────────┘
         │                 │
         └────────┬────────┘
                  │
                  ▼
         ┌──────────────────┐
         │   SUCCESS        │
         │ Show signature   │
         │ Solscan link     │
         │ Go to Dashboard  │
         └──────────────────┘
```

## Files & Their Relationships

```
FRONTEND LAYER
├── components/
│   └── checkout/
│       └── payment-prep.tsx ◄───────────┐
│           ├─ imports ExecutePaymentWithWalletSignature
│           ├─ handles UI state
│           └─ calls error handling
│
└── lib/
    └── transaction-signing.ts ◄────────┤─ Contains all
        ├─ prepareTransaction()          │   signing logic
        ├─ decodeTransaction()           │
        ├─ signTransaction()             │
        ├─ encodeTransaction()           │
        ├─ submitSignedTransaction()     │
        ├─ pollTransactionConfirmation() │
        ├─ executePaymentWithWalletSignature() ◄─ Main orchestrator
        └─ TransactionError class        │

BACKEND LAYER
├── app/api/payment/
│   ├── prepare/route.ts ◄───────────────┤─ Endpoints
│   ├── submit-signed/route.ts           │
│   └── status/route.ts ◄────────────────┤

WALLET LAYER
└── @solana/wallet-adapter-react
    ├─ useWallet() hook
    ├─ wallet.signTransaction()
    └─ WalletMultiButton component

BLOCKCHAIN LAYER
└── Solana Network (Devnet/Testnet/Mainnet)
    └─ Receives and processes transactions
```

---

This architecture provides a **secure, user-friendly transaction signing experience** while maintaining full control at each step of the process.
