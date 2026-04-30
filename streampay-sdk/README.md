# StreamPay SDK

[![npm version](https://img.shields.io/npm/v/streampay-sdk.svg?style=flat-square)](https://www.npmjs.com/package/streampay-sdk)
[![npm downloads](https://img.shields.io/npm/dm/streampay-sdk.svg?style=flat-square)](https://www.npmjs.com/package/streampay-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Twitter Follow](https://img.shields.io/twitter/follow/streampay_io?style=social)](https://twitter.com/streampay_io)

**Privacy-first, cross-chain payment infrastructure for Solana.** 

StreamPay enables developers to integrate private, high-performance payments and subscriptions into their applications using Cloak's privacy layer and MagicBlock's execution optimization.

---

## 📑 Table of Contents

- [🌟 Features](#-features)
- [🏗️ Architecture](#-architecture)
- [🚀 Quick Start](#-quick-start)
- [💳 Payments API](#-payments-api)
- [🔄 Subscriptions API](#-subscriptions-api)
- [🔒 Security & Privacy](#-security--privacy)
- [🛠️ Configuration](#-configuration)
- [🔌 Framework Integrations](#-framework-integrations)
- [📦 Utilities](#-utilities)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🌟 Features

- **🔐 Privacy by Default** - Powered by [Cloak](https://cloak.exchange/), keeping transaction amounts and recipients confidential.
- **⚡ Optimized Execution** - Integrated with [MagicBlock](https://magicblock.io/) for ultra-fast transaction finality and MEV protection.
- **🚀 RPC Fast Infrastructure** - Low-latency RPC routing for globally distributed payments.
- **💰 Multi-Currency** - Native support for USDC, USDT, and SOL.
- **🔄 Recurring Billing** - Flexible subscription management with automatic interval handling.
- **🛡️ Resilience** - Built-in exponential backoff retries and robust error handling.
- **🎯 Developer Experience** - 100% TypeScript, zero external dependencies, and a clean, intuitive API.

---

## 🏗️ Architecture

StreamPay isn't just another payment wrapper. It's a sophisticated execution layer built on three pillars:

1.  **Cloak Privacy Layer**: Utilizes zero-knowledge proofs and stealth addresses to ensure your financial data remains private on a public ledger.
2.  **MagicBlock Execution**: Leverages ephemeral rollups and state-transition optimizations to process transactions at the speed of thought.
3.  **RPC Fast**: A high-performance RPC routing layer that ensures your transactions are submitted to the most optimal validator node in real-time.
4.  **Solana Core**: Settles on the most performant L1, ensuring global reach and instant liquidity.

---

## 🚀 Quick Start

### 1. Installation

```bash
npm install streampay-sdk
# or
yarn add streampay-sdk
# or
pnpm add streampay-sdk
```

### 2. Initialize the SDK

```typescript
import { StreamPay } from "streampay-sdk";

const sdk = new StreamPay({
  apiKey: process.env.STREAMPAY_API_KEY!, // Get yours at dashboard.streampay.io
  debug: process.env.NODE_ENV === "development",
});
```

### 3. Create Your First Private Payment

```typescript
const payment = await sdk.payments.create({
  amount: 2500, // $25.00 (in cents)
  currency: "USDC",
  recipient_id: "user_wallet_address",
  privacy_mode: "cloak", // Enabled by default
  source_chain: "solana",
});

console.log(`Payment Initiated: ${payment.id}`);
```

---

## 💳 Payments API

### Create a Payment
```typescript
const payment = await sdk.payments.create({
  amount: 5000,
  currency: "USDC",
  recipient_id: "7qLn8gQUJfaRFMx2HaJe5aAMYm7MgKgsCp7PVKgBvfXY",
  privacy_mode: "cloak",
  metadata: { orderId: "12345" }
});
```

### Get Payment Status
```typescript
const status = await sdk.payments.getStatus("pay_abc123");
// Status flow: pending -> completed | failed
```

### Batch Payments
```typescript
const results = await sdk.payments.createBatch({
  payments: [/* array of payment requests */],
  stop_on_error: false
});
```

---

## 🔄 Subscriptions API

### Create a Subscription
```typescript
const subscription = await sdk.subscriptions.create({
  amount: 2999, // $29.99
  currency: "USDC",
  interval: "monthly",
  recipient_id: "wallet_address",
  trial_period_days: 7
});
```

### Manage Lifecycle
```typescript
await sdk.subscriptions.pause("sub_123");
await sdk.subscriptions.resume("sub_123");
await sdk.subscriptions.cancel("sub_123");
```

---

## 🔒 Security & Privacy

### How Cloak Protection Works
When you set `privacy_mode: "cloak"`, StreamPay routes the transaction through the Cloak network. This:
- Obfuscates the recipient's wallet address.
- Masks the transaction amount from public explorers.
- Maintains compliance while preserving user sovereignty.

### API Security
- **Idempotency**: Use `generateIdempotencyKey()` for safe retries.
- **Validation**: All inputs are strictly validated before being sent to the API.
- **Environment**: Never expose your `sp_live_` key on the frontend. Use a backend proxy.

---

## 🔌 Framework Integrations

### Next.js API Route Example
```typescript
import { StreamPay } from "streampay-sdk";

const sdk = new StreamPay({ apiKey: process.env.STREAMPAY_API_KEY! });

export default async function handler(req, res) {
  try {
    const payment = await sdk.payments.create(req.body);
    res.status(200).json(payment);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
}
```

---

## 📦 Utilities

StreamPay comes with built-in helpers to speed up development:

- `isValidSolanaAddress(addr)`: Validates Base58 Solana addresses.
- `formatAmount(amount, currency)`: Pretty-print amounts (e.g., `1000 -> "10.00 USDC"`).
- `retryWithBackoff(fn)`: Sophisticated retry logic for flaky networks.

---

## 🤝 Contributing

We love our contributors! Whether it's a bug report or a new feature, please check out our [Contributing Guide](CONTRIBUTING.md).

1. Fork the repo.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  <br />
  Built with ❤️ for the Solana Hackathon by <b>StreamPay Team</b>
  <br />
  <a href="https://streampay.io">Website</a> • <a href="https://docs.streampay.io">Docs</a> • <a href="https://twitter.com/streampay_io">Twitter</a>
</p>--

**Built with ❤️ by [StreamPay](https://streampay.io)** - Making privacy-first payments accessible to everyone.
