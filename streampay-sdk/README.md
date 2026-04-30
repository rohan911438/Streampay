# StreamPay SDK

[![npm version](https://badge.fury.io/js/streampay-sdk.svg)](https://badge.fury.io/js/streampay-sdk)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

> **Privacy-first, cross-chain payment infrastructure for Solana.** Build private payments with Cloak protection and MagicBlock execution optimization.

## 🌟 Features

- **🔐 Privacy by Default** - All payments protected by Cloak's privacy layer
- **⚡ Optimized Execution** - MagicBlock integration for faster, cheaper transactions
- **💰 Multi-Currency Support** - USDC, USDT, and native SOL payments
- **📦 Subscriptions** - Recurring billing with flexible intervals
- **🔄 Automatic Retries** - Built-in exponential backoff for resilience
- **📊 Type-Safe** - Full TypeScript support with strict types
- **🎯 Developer-Friendly** - Clean API, zero dependencies, excellent docs
- **🧪 Battle-Tested** - Production-ready with error handling

## 📋 What is StreamPay?

StreamPay is a Stripe-like payment gateway for Web3 that enables:

- **Private Payments** via [Cloak](https://cloak.exchange/) - transaction amounts and recipients hidden on-chain
- **Optimized Execution** via [MagicBlock](https://magicblock.io/) - MEV protection and faster finality
- **Solana Settlement** - payments settle on Solana mainnet with instant finality
- **Cross-Chain Support** - integrate from any chain, settle on Solana

## 🚀 Quick Start

### Installation

```bash
npm install streampay-sdk
```

### Basic Usage

```typescript
import { StreamPay } from "streampay-sdk";

// Initialize SDK with your API key
const sdk = new StreamPay({
  apiKey: "sp_live_abc123...",
});

// Create a private payment
const payment = await sdk.payments.create({
  amount: 1000, // $10.00 in cents
  currency: "USDC",
  recipient_id: "7qLn8gQUJfaRFMx2HaJe5aAMYm7MgKgsCp7PVKgBvfXY",
  privacy_mode: "cloak",
  source_chain: "solana",
});

console.log(`Payment created: ${payment.id}`);
console.log(`Status: ${payment.status}`);
console.log(`Transaction: ${payment.transaction_signature}`);

// Check payment status
const updated = await sdk.payments.getStatus({
  payment_id: payment.id,
});

console.log(`Final status: ${updated.status}`);
```

## 💳 Payments API

### Create a Payment

```typescript
const payment = await sdk.payments.create({
  amount: 5000, // Amount in smallest unit (cents for USD)
  currency: "USDC", // USDC, USDT, or SOL
  recipient_id: "wallet_or_user_id",
  privacy_mode: "cloak", // "cloak" or "public"
  source_chain: "solana",
  metadata: {
    orderId: "order_123",
    customerId: "user_456",
  },
});
```

**Response:**
```typescript
{
  id: "pay_abc123...",
  amount: 5000,
  currency: "USDC",
  status: "pending", // pending → completed → failed
  privacy_mode: "cloak",
  transaction_signature: "5aB...",
  magicblock_reference: "mb_...",
  created_at: 1703000000,
  updated_at: 1703000005
}
```

### Get Payment Status

```typescript
const payment = await sdk.payments.getStatus({
  payment_id: "pay_abc123...",
});

if (payment.status === "completed") {
  console.log("Payment successful!");
  console.log(`TX: https://solscan.io/tx/${payment.transaction_signature}`);
}
```

### List Payments

```typescript
const { data, total, has_more } = await sdk.payments.list({
  limit: 50,
  page: 1,
  status: "completed",
  recipient_id: "wallet_xyz",
});

console.log(`Total: ${total}, This page: ${data.length}`);
```

### Batch Payments

```typescript
const results = await sdk.payments.createBatch({
  payments: [
    {
      amount: 1000,
      currency: "USDC",
      recipient_id: "wallet1",
      privacy_mode: "cloak",
      source_chain: "solana",
    },
    {
      amount: 2000,
      currency: "USDC",
      recipient_id: "wallet2",
      privacy_mode: "cloak",
      source_chain: "solana",
    },
  ],
  stop_on_error: false,
});

console.log(`Successful: ${results.successful}, Failed: ${results.failed}`);
```

### Refund a Payment

```typescript
const refund = await sdk.payments.refund({
  payment_id: "pay_abc123...",
  reason: "Customer requested",
  amount: 1000, // Partial refund (optional)
});

console.log(`Refund status: ${refund.status}`);
```

## 🔄 Subscriptions API

### Create a Subscription

```typescript
const subscription = await sdk.subscriptions.create({
  amount: 2999, // $29.99 per month
  currency: "USDC",
  interval: "monthly", // weekly, monthly, yearly
  recipient_id: "user_wallet",
  privacy_mode: "cloak",
  trial_period_days: 7, // Optional free trial
  metadata: {
    plan: "pro",
    userId: "user_123",
  },
});

console.log(`Subscription created: ${subscription.id}`);
console.log(`Next billing: ${new Date(subscription.next_billing_at * 1000)}`);
```

### Get Subscription Status

```typescript
const subscription = await sdk.subscriptions.getStatus({
  subscription_id: "sub_abc123...",
});

if (subscription.status === "active") {
  console.log(`Next billing: ${new Date(subscription.next_billing_at * 1000)}`);
}
```

### Update Subscription Amount

```typescript
const updated = await sdk.subscriptions.updateAmount({
  subscription_id: "sub_abc123...",
  new_amount: 3999, // New $39.99 per month
  effective_from: "next_billing", // or "immediately"
});

console.log(`Updated to: $${updated.amount / 100} per ${updated.interval}`);
```

### Pause/Resume Subscription

```typescript
// Pause
const paused = await sdk.subscriptions.pause({
  subscription_id: "sub_abc123...",
  reason: "Customer on vacation",
});

// Resume
const resumed = await sdk.subscriptions.resume("sub_abc123...");

console.log(`Status: ${resumed.status}`);
```

### Cancel Subscription

```typescript
const cancelled = await sdk.subscriptions.cancel({
  subscription_id: "sub_abc123...",
  reason: "Customer churn",
});

console.log(`Cancelled: ${cancelled.status}`);
```

### Get Subscription Invoices

```typescript
const invoices = await sdk.subscriptions.getInvoices({
  subscription_id: "sub_abc123...",
  limit: 10,
  page: 1,
});

invoices.data.forEach((invoice) => {
  console.log(`${invoice.id}: $${invoice.amount / 100} - ${invoice.status}`);
});
```

## 🔒 Error Handling

```typescript
import { StreamPay, APIError } from "streampay-sdk";

const sdk = new StreamPay({ apiKey: "..." });

try {
  const payment = await sdk.payments.create({
    amount: 1000,
    currency: "USDC",
    recipient_id: "invalid",
    privacy_mode: "cloak",
    source_chain: "solana",
  });
} catch (error) {
  if (error instanceof APIError) {
    console.error(`Error [${error.code}]: ${error.message}`);
    console.error(`Status: ${error.statusCode}`);
    console.error(`Request ID: ${error.requestId}`);

    if (error.code === "INVALID_REQUEST") {
      // Handle validation error
    } else if (error.code === "RATE_LIMITED") {
      // Implement backoff
    } else if (error.code === "SERVER_ERROR") {
      // Retry with exponential backoff
    }
  } else {
    console.error("Unknown error:", error);
  }
}
```

## 🔐 TypeScript Types

```typescript
import {
  StreamPayConfig,
  CreatePaymentRequest,
  PaymentResponse,
  CreateSubscriptionRequest,
  SubscriptionResponse,
  APIError,
} from "streampay-sdk";

// Type-safe API calls
const config: StreamPayConfig = {
  apiKey: "sp_live_...",
  baseUrl: "https://api.streampay.io",
  timeout: 30000,
  debug: true,
};

const sdk = new StreamPay(config);

// Full type support
const paymentRequest: CreatePaymentRequest = {
  amount: 1000,
  currency: "USDC",
  recipient_id: "wallet",
  privacy_mode: "cloak",
  source_chain: "solana",
};

const payment: PaymentResponse = await sdk.payments.create(paymentRequest);
```

## 🛠️ Configuration

```typescript
const sdk = new StreamPay({
  apiKey: "sp_live_abc123...", // Required: Get from dashboard
  baseUrl: "https://api.streampay.io", // Optional: defaults to production
  timeout: 30000, // Optional: request timeout in ms
  debug: true, // Optional: enable debug logging
  headers: {
    // Optional: custom headers
    "X-Custom-Header": "value",
  },
});

// Enable/disable debug logging
sdk.enableDebug();
sdk.disableDebug();

// Get current config
const config = sdk.getConfig();
console.log(config);
```

## 🏥 Health Check

```typescript
const isHealthy = await sdk.health();
console.log(`API healthy: ${isHealthy}`);
```

## 📦 Utilities

```typescript
import {
  validateApiKey,
  generateIdempotencyKey,
  formatAmount,
  isValidSolanaAddress,
  isValidEmail,
  retryWithBackoff,
} from "streampay-sdk";

// Validate API key format
validateApiKey("sp_live_abc123..."); // true

// Generate idempotency key
const key = generateIdempotencyKey();

// Format amount for display
formatAmount(1000, "USDC", 2); // "10.00 USDC"

// Validate Solana address
isValidSolanaAddress("7qLn8gQUJfaRFMx2HaJe5aAMYm7MgKgsCp7PVKgBvfXY"); // true

// Validate email
isValidEmail("user@example.com"); // true

// Retry with exponential backoff
const result = await retryWithBackoff(
  async () => {
    // your async operation
  },
  3, // max retries
  100 // initial delay in ms
);
```

## 🌐 Environment Setup

### Get Your API Key

1. Visit [StreamPay Dashboard](https://dashboard.streampay.io)
2. Go to **Developers** → **API Keys**
3. Create a new key (test or live)
4. Copy and secure it in your `.env` file

### Environment Variables

```bash
# .env
STREAMPAY_API_KEY=sp_live_abc123...
STREAMPAY_BASE_URL=https://api.streampay.io
STREAMPAY_DEBUG=false
```

```typescript
const sdk = new StreamPay({
  apiKey: process.env.STREAMPAY_API_KEY!,
  baseUrl: process.env.STREAMPAY_BASE_URL,
  debug: process.env.STREAMPAY_DEBUG === "true",
});
```

## 🔌 Integration Examples

### Express.js Payment Endpoint

```typescript
import express from "express";
import { StreamPay } from "streampay-sdk";

const app = express();
const sdk = new StreamPay({ apiKey: process.env.STREAMPAY_API_KEY! });

app.post("/api/payments", async (req, res) => {
  try {
    const { amount, recipient, metadata } = req.body;

    const payment = await sdk.payments.create({
      amount,
      currency: "USDC",
      recipient_id: recipient,
      privacy_mode: "cloak",
      source_chain: "solana",
      metadata,
    });

    res.json({ success: true, payment });
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});
```

### Next.js API Route

```typescript
// pages/api/subscribe.ts
import { StreamPay } from "streampay-sdk";
import { NextApiRequest, NextApiResponse } from "next";

const sdk = new StreamPay({ apiKey: process.env.STREAMPAY_API_KEY! });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  try {
    const { amount, interval, recipient } = req.body;

    const subscription = await sdk.subscriptions.create({
      amount,
      currency: "USDC",
      interval,
      recipient_id: recipient,
      privacy_mode: "cloak",
    });

    res.json({ success: true, subscription });
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
}
```

### React Hook

```typescript
import { useState } from "react";
import { StreamPay, APIError } from "streampay-sdk";

export function useStreamPay(apiKey: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<APIError | null>(null);

  const sdk = new StreamPay({ apiKey });

  const createPayment = async (
    amount: number,
    recipient: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const payment = await sdk.payments.create({
        amount,
        currency: "USDC",
        recipient_id: recipient,
        privacy_mode: "cloak",
        source_chain: "solana",
      });

      return payment;
    } catch (err) {
      const apiError = err instanceof APIError ? err : new APIError(
        "UNKNOWN",
        String(err),
        0
      );
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  };

  return { createPayment, loading, error };
}
```

## 🧪 Testing

```bash
npm test
npm run test:watch
npm run test:coverage
```

## 🏗️ Building

```bash
# Build TypeScript
npm run build

# Build with watch mode
npm run build:watch

# Type check
npm run typecheck

# Format code
npm run format

# Lint
npm run lint
```

## 📚 API Reference

Full API documentation available at [docs.streampay.io](https://docs.streampay.io)

### Payment Status Flow

```
pending → completed ✓
       → failed ✗
```

### Subscription Status Flow

```
active ↔ paused
  ↓
canceled ✗
  ↑
inactive
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md)

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 💬 Support

- 📧 Email: [support@streampay.io](mailto:support@streampay.io)
- 💬 Discord: [StreamPay Community](https://discord.gg/streampay)
- 📖 Docs: [docs.streampay.io](https://docs.streampay.io)
- 🐛 Issues: [GitHub Issues](https://github.com/streampay/streampay-sdk-js/issues)

## 🔗 Links

- **Website**: [streampay.io](https://streampay.io)
- **Dashboard**: [dashboard.streampay.io](https://dashboard.streampay.io)
- **Docs**: [docs.streampay.io](https://docs.streampay.io)
- **GitHub**: [github.com/streampay/streampay-sdk-js](https://github.com/streampay/streampay-sdk-js)

---

**Built with ❤️ by [StreamPay](https://streampay.io)** - Making privacy-first payments accessible to everyone.
