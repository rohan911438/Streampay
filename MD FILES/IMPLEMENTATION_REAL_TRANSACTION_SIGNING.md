# Real Transaction Signing Flow Implementation

## Overview

This document describes the implementation of a real transaction signing flow for StreamPay. Instead of signing transactions on the backend, the frontend now:

1. Fetches an unsigned transaction from the backend
2. Decodes the base64 transaction
3. Uses the wallet adapter to sign the transaction (opens Phantom/wallet)
4. Sends the signed transaction to the Solana network
5. Confirms the transaction on-chain

## Architecture

### Backend Components

#### 1. **Prepare Transaction Endpoint** (`/api/payment/prepare`)
- **Method**: `POST`
- **Purpose**: Creates an unsigned transaction and returns it as base64
- **Request**:
  ```json
  {
    "walletAddress": "...",
    "amount": 10,
    "planId": "...",
    "type": "private" // or "public"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "transaction": "base64_encoded_tx",
    "blockhash": "...",
    "paymentId": "...",
    "amount": 10,
    "walletAddress": "...",
    "message": "Unsigned transaction prepared"
  }
  ```

#### 2. **Submit Signed Transaction** (`/api/payment/submit-signed`)
- **Method**: `POST`
- **Purpose**: Sends a signed transaction to the Solana network
- **Request**:
  ```json
  {
    "signedTransaction": "base64_encoded_signed_tx",
    "paymentId": "..."
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "signature": "...",
    "paymentId": "...",
    "confirmed": true,
    "message": "Transaction successfully signed and submitted"
  }
  ```

#### 3. **Check Transaction Status** (`/api/payment/status`)
- **Method**: `GET`
- **Purpose**: Check if a transaction is confirmed on-chain
- **Query Parameters**:
  - `signature`: Transaction signature to check
- **Response**:
  ```json
  {
    "signature": "...",
    "confirmed": true,
    "confirmationStatus": "confirmed",
    "confirmations": 5,
    "status": "finalized"
  }
  ```

### Frontend Components

#### 1. **Transaction Signing Utilities** (`lib/transaction-signing.ts`)

Key functions:

```typescript
// STEP 1 & 2: Prepare and fetch unsigned transaction
prepareTransaction(walletAddress, amount, planId?, type?)

// STEP 3: Decode base64 to Transaction object
decodeTransaction(base64Transaction: string): Transaction

// STEP 4: Sign transaction using wallet adapter
signTransaction(transaction: Transaction, wallet: WalletContextState): Promise<Transaction>

// STEP 5: Encode signed transaction back to base64
encodeTransaction(signedTransaction: Transaction): string

// STEP 6 & 7: Submit and confirm
submitSignedTransaction(base64SignedTx: string, paymentId: string): Promise<SubmitSignedTransactionResponse>

// STEP 8: Poll for confirmation
pollTransactionConfirmation(signature: string, maxAttempts?, initialDelayMs?): Promise<{confirmed, signature, attempts}>

// Complete flow: Orchestrates all steps
executePaymentWithWalletSignature(walletAddress, amount, wallet, planId?, type?)
```

#### 2. **Payment Component** (`components/checkout/payment-prep.tsx`)

- Updated `onPrivatePaymentClick()` to use the new signing flow
- Imports and uses `executePaymentWithWalletSignature()`
- Handles `TransactionError` exceptions with specific error codes
- Displays different UI states:
  - **Loading**: Shows spinner while preparing/signing/submitting
  - **Success (Confirmed)**: Green header with confirmed status
  - **Success (Pending)**: Blue header with pending confirmation
  - **Error**: Red alert with specific error message

## Implementation Flow

### User Journey

```
1. User clicks "Private Pay" button
                ↓
2. Frontend validates wallet connection
                ↓
3. Frontend calls `/api/payment/prepare`
   ← Backend returns base64 unsigned transaction
                ↓
4. Frontend decodes base64 → Transaction object
                ↓
5. Frontend calls wallet.signTransaction()
   🔥 PHANTOM OPENS HERE 🔥
   ← User signs or rejects
                ↓
6. Frontend encodes signed transaction → base64
                ↓
7. Frontend calls `/api/payment/submit-signed`
   ← Backend sends to Solana network
   ← Backend returns signature
                ↓
8. Frontend polls `/api/payment/status?signature=...`
   ← Backend checks on-chain confirmation
                ↓
9. Frontend displays success (confirmed or pending)
```

## Error Handling

The implementation includes comprehensive error handling with specific error codes:

| Error Code | Description | User Message |
|-----------|-------------|--------------|
| `WALLET_REJECTED` | User rejected signing | "You rejected the transaction signing request" |
| `WALLET_NOT_CONNECTED` | Wallet not connected | "Please connect your wallet first" |
| `WALLET_NO_SIGN` | Wallet doesn't support signing | "Wallet does not support transaction signing" |
| `INVALID_WALLET` | Invalid wallet address | "Wallet address is required" |
| `INVALID_AMOUNT` | Invalid amount | "Amount must be greater than 0" |
| `PREPARE_FAILED` | Backend failed to prepare | "Failed to prepare transaction" |
| `DECODE_FAILED` | Failed to decode base64 | "Failed to decode transaction" |
| `SIGN_FAILED` | Signing operation failed | "Failed to sign the transaction" |
| `ENCODE_FAILED` | Failed to encode signed tx | "Failed to encode signed transaction" |
| `SUBMIT_FAILED` | Backend failed to submit | "Failed to submit transaction" |
| `SUBMIT_NETWORK_ERROR` | Network error | "Failed to submit transaction" |
| `NETWORK_ERROR` | Network error during prepare | "Failed to prepare transaction" |

## Files Modified/Created

### Created Files
- `/api/payment/prepare/route.ts` - Prepare unsigned transactions
- `/api/payment/submit-signed/route.ts` - Submit signed transactions
- `/lib/transaction-signing.ts` - Frontend transaction signing utilities

### Modified Files
- `/api/payment/status/route.ts` - Enhanced to support transaction signature checking
- `/components/checkout/payment-prep.tsx` - Updated to use real signing flow

## Testing the Implementation

### Test Steps

1. **Connect Wallet**
   - Open the payment page
   - Click "Connect Wallet"
   - Select Phantom or other Solana wallet
   - Approve connection

2. **Initiate Payment**
   - Select "Private Payment" mode
   - Click "Secure Checkout" button

3. **Sign Transaction**
   - Phantom wallet opens
   - Review transaction details
   - Click "Approve" to sign

4. **Monitor Confirmation**
   - UI shows "Payment Submitted" with pending status
   - After 30 seconds, shows "Payment Confirmed"
   - Transaction signature is clickable link to Solscan

### Network Considerations

- **Devnet**: Transactions confirm quickly (2-5 seconds)
- **Mainnet-beta**: May take 15-30 seconds for confirmation
- **Testnet**: May take 30-60 seconds

### Debugging

Enable console logging to see the flow steps:

```javascript
// Console will show:
[PaymentFlow] Starting payment with wallet signature...
[PaymentFlow] Step 1-2: Preparing transaction from backend...
[PaymentFlow] Step 3: Decoding transaction from base64...
[PaymentFlow] Step 4: Signing transaction with wallet...
[TransactionSigning] Opening wallet for signing...
[TransactionSigning] Transaction signed successfully
[PaymentFlow] Step 5: Encoding signed transaction...
[PaymentFlow] Step 6-7: Submitting signed transaction...
[TransactionSubmit] Transaction submitted with signature: ...
[PaymentFlow] Step 8: Polling for confirmation...
```

## Security Considerations

1. **Private Key Never Exposed**
   - Private keys remain in the wallet
   - Backend never sees private keys
   - Signing happens entirely on the client

2. **Transaction Validation**
   - Frontend validates transaction structure
   - RPC endpoint validates before broadcasting
   - On-chain confirmation before marking success

3. **Wallet Adapter Security**
   - Uses official Solana wallet adapter
   - All major wallets supported (Phantom, Solflare, etc.)
   - Standardized signing interface

4. **Backend Validation**
   - Backend validates signed transaction format
   - Backend checks signature before broadcasting
   - Database tracks all transactions

## Future Enhancements

1. **Batch Transactions**
   - Support multiple transactions in one signing flow

2. **Advanced Confirmation**
   - Track finalization status separately
   - Support different commitment levels

3. **Transaction History**
   - Store all transactions in database
   - Display transaction history to user

4. **Analytics**
   - Track signing success rates
   - Monitor transaction confirmation times
   - Identify wallet compatibility issues

5. **Retry Logic**
   - Auto-retry failed submissions
   - Exponential backoff for network issues
