<p align="center">
  <img src="apps/web/public/logo.png" alt="StreamPay Logo" width="120" />
</p>

<h1 align="center">StreamPay</h1>

<p align="center">
  <b>Private, cross-chain payment infrastructure powered by Solana</b>
</p>

<p align="center">
  <a href="https://streampay-web.vercel.app">🌐 Live App</a> •
  <a href="#">🎥 Demo Video (Coming Soon)</a> •
  <a href="#">📊 Pitch Deck (Coming Soon)</a>
</p>

<p align="center">
  Built by <b>Rohan Kumar</b> • Team <b>BROTHERHOOD</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/Solana-9945FF?style=for-the-badge&logo=solana&logoColor=white" alt="Solana" />
  <img src="https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge" alt="Status" />
</p>

## 🚀 Overview

StreamPay is the bridge between the freedom of crypto and the privacy of traditional finance. We provide the infrastructure for businesses to accept payments from any chain while maintaining the confidentiality and speed of a private network.

### The Problem
*   **Crypto is too public:** Traditional blockchain transactions expose sensitive business data, payroll, and vendor details to the world.
*   **Cross-chain is a nightmare:** Moving assets between chains is slow, expensive, and technically complex for the average user.
*   **Infrastructure gap:** Merchants lack professional-grade tools to manage private, recurring, and cross-chain revenue in one place.

### The Solution
StreamPay abstracts the complexity of the multi-chain world. 
*   **Metadata Abstraction:** We enable "private-like" payments by decoupling transaction execution from public data, storing sensitive details in a secure off-chain layer.
*   **Unified Settlement:** Users can pay with any asset from any chain, while merchants receive settled funds on Solana—the fastest, most efficient network for global commerce.
*   **Merchant-First Design:** A powerful dashboard that provides full visibility without compromising on-chain privacy.

---

## 🧠 How It Works

StreamPay orchestrates a seamless multi-step process to ensure privacy and efficiency:

1.  **Chain Selection:** The user chooses their preferred payment source (Ethereum, Base, etc.).
2.  **Route Discovery:** **LI.FI** identifies the most efficient bridge and swap path for the selected asset.
3.  **Optimal Swap:** **Jupiter** optimizes the final conversion into SOL or USDC on Solana.
4.  **Private Execution:** The payment is executed on the Solana network using our custom router.
5.  **Metadata Shielding:** Sensitive payment details (recipient, purpose, etc.) are stored in a secure off-chain vault, keeping the public ledger clean.
6.  **Merchant Insight:** The merchant receives real-time updates and full transaction details via the StreamPay Dashboard.

---

## The Problem
Traditional blockchain payments are fully transparent. While this is great for public records, it is a dealbreaker for real-world financial operations.
- **Payroll**: Disclosing employee salaries to the entire world is a security and privacy risk.
- **B2B Subscriptions**: Business expenses and vendor relationships should not be public knowledge.
- **Privacy as a Right**: Users should have the choice to keep their financial activity confidential.

StreamPay solves this by making **Privacy the Default**, ensuring that your financial footprint is protected by state-of-the-art shielded transactions.

---

## 🚀 Features

- **🛡️ Private Payments (Cloak)**: Shielded transfers where amount and recipient are hidden from public ledgers.
- **🔄 Seamless Subscriptions**: Automated recurring payment logic for SaaS, services, and payroll.
- **📊 Real-time Analytics (Dune)**: Deep insights into revenue and user behavior powered by Dune Analytics.
- **⚡ Reliable Infrastructure (RPC Fast)**: Low-latency, high-performance access to the Solana network.
- **🔄 Dodo Fallback**: A reliable public payment path for standard transactions when privacy is not a priority.

---

## 🛡️ Core Integration: Cloak Privacy Layer

Cloak is the heart of StreamPay. It is responsible for executing **shielded transactions** that break the link between the sender and receiver on the public ledger.

- **How it Works**: When a user pays, the Cloak SDK generates a private transfer. On-chain, the transaction details are obscured, making it impossible for outside observers to determine the transaction's value or destination.
- **Selective Auditability**: Privacy doesn't mean lack of accountability. StreamPay supports **viewing keys**, allowing users to selectively disclose transaction details to auditors or tax authorities without making them public to everyone.
- **Centralized Tracking**: Every private transaction is recorded in our database with a unique reference, allowing for reliable internal tracking and subscription management without compromising on-chain privacy.

---

## 📊 Analytics & Fallbacks: Dune + Dodo

While Cloak provides the privacy, we use best-in-class tools to power the rest of the ecosystem:

- **Dune Analytics**: We leverage Dune to provide real-time dashboards of non-sensitive metrics, such as aggregate revenue trends and active subscription counts, ensuring merchants have the data they need to grow.
- **Dodo Payments**: We maintain Dodo as a secondary, public fallback option. This allows users who prefer traditional blockchain transparency—or those in jurisdictions requiring standard transfers—to still participate in the StreamPay ecosystem.

---

## ⚡ Infrastructure: RPC Fast

To ensure that StreamPay remains "seamless and fast," we utilize **RPC Fast** as our primary Solana infrastructure provider. This ensures that every blockchain interaction—from wallet balance checks to complex shielded transaction submissions—benefits from enterprise-grade performance.

- **Low Latency**: Near-instant transaction broadcasting and confirmation, crucial for a smooth user experience during checkout.
- **High Reliability**: RPC Fast provides consistent uptime and high rate limits, ensuring that automated subscription renewals and one-time payments never fail due to public network congestion.
- **Scalability**: Designed to handle high-frequency transaction loads, supporting our vision for professional-grade financial operations.

All transactions generated through our **Cloak** and **MagicBlock** execution layers are routed through RPC Fast to guarantee the best possible performance and delivery success rate.

---

## 🛠️ Getting Started

### 1) Prerequisites
- Node.js 18+ 
- A Solana wallet (Phantom recommended)
- A local Postgres database

### 2) Installation
```bash
# Install dependencies
npm install --legacy-peer-deps

# Apply database schema
psql "$DATABASE_URL" -f db/002_payments_table.sql
```

### 3) Environment Setup
Create a `.env` file in the root:
```env
# Solana Configuration
SOLANA_RPC_URL=your_rpc_fast_url
NEXT_PUBLIC_SOLANA_RPC_URL=your_rpc_fast_url

# Cloak Configuration
CLOAK_PRIVATE_PAYMENT_SIGNER_KEY=your_cloak_signer_key

# Dodo Fallback (Optional)
DODO_API_KEY=your_dodo_key
DODO_WEBHOOK_SECRET=your_webhook_secret

# Database
DATABASE_URL=postgres://user:pass@localhost:5432/streampay
```

### 4) Run the Platform
```bash
# Start the development server
npm run dev

# (Optional) Start ngrok for webhook testing
ngrok http 3000
```

---

## 🧪 Demo Flow

1. **Connect**: Open the application and connect your Solana wallet.
2. **Select Plan**: Browse available subscription plans on the demo page (`/pay/demo`).
3. **Private Checkout**: Notice that **Private Payment (Cloak)** is pre-selected as the recommended method.
4. **Pay**: Execute the transaction. You will see a "Securing Privacy..." loading state.
5. **Success**: Receive a confirmation message explaining that your payment was successful and that your details are hidden on-chain.
6. **Verify**: Check the Merchant Dashboard to see your new private subscription active and tagged with a 🔒 badge.

---

## 🔗 Payment Router Contract Deployment

The StreamPay Payment Router contract is now live on Solana Devnet:

### Contract Details
- **Program ID**: `Bs464Nm3DY6qNafJn5kmVHxh9R8nKRLpuXfdDrZQMd76`
- **Deployment Signature**: `5QV3WoHgcumYgH5brQpBKBdNcfAoeZt2XCofdrJG8y65JxEX8rdhpzGhGeY1usT1eDefzdp4kmpfk1iv5smFfJHy`
- **Status**: ✅ Finalized
- **Timestamp**: Apr 30, 2026 at 10:15:33 IST

### Verify Transaction
View the deployment on [Solana Explorer (Devnet)](https://explorer.solana.com/tx/5QV3WoHgcumYgH5brQpBKBdNcfAoeZt2XCofdrJG8y65JxEX8rdhpzGhGeY1usT1eDefzdp4kmpfk1iv5smFfJHy?cluster=devnet)

### What the Contract Does
- **Records Payment Intents**: Creates `PaymentRecord` accounts with initial `Pending` status
- **Confirms Execution**: Updates records to `Completed` with execution reference from Cloak/MagicBlock
- **Flexible Authorization**: Supports user, merchant, or backend authority confirmation
- **Privacy-Aware**: Designed to work seamlessly with Cloak private transfers

### Integration
The contract is integrated into the TypeScript ecosystem via:
```typescript
import { 
  createPaymentRecord, 
  confirmPaymentRecord,
  PAYMENT_ROUTER_PROGRAM_ID 
} from "@paystream/solana";
```

See [contracts/payment-router/README.md](contracts/payment-router/README.md) for detailed integration examples.

---

## 🔗 Subscription Manager Contract Deployment

The StreamPay Subscription Manager contract is now live on Solana Devnet:

### Contract Details
- **Program ID**: `Bs464Nm3DY6qNafJn5kmVHxh9R8nKRLpuXfdDrZQMd76`
- **Upgrade Signature**: `TzkUpt83SxkEYky7Nz97kKoNaWExTrEW1FTjjksJhmGFhNQbHk2SW2xRH9gk71k84ZekF64cenFibWHJhxSSype`
- **Status**: ✅ Finalized
- **Timestamp**: Apr 30, 2026 at 10:21:46 IST

### Verify Transaction
View the deployment on [Solana Explorer (Devnet)](https://explorer.solana.com/tx/TzkUpt83SxkEYky7Nz97kKoNaWExTrEW1FTjjksJhmGFhNQbHk2SW2xRH9gk71k84ZekF64cenFibWHJhxSSype?cluster=devnet)

### What the Contract Does
- **Creates Plans**: Merchants register subscription plans with amount and duration
- **Activates Subscriptions**: Links payment records to active subscriptions
- **Renews Subscriptions**: Extends subscription periods upon payment confirmation
- **Tracks Status**: Monitors subscription lifecycle (Active, Paused, Expired, Cancelled)

### Integration
The contract is integrated into the TypeScript ecosystem via:
```typescript
import { 
  createSubscriptionPlan, 
  activateSubscription, 
  renewSubscription,
  SUBSCRIPTION_MANAGER_PROGRAM_ID 
} from "@paystream/solana";
```

See [contracts/subscription-manager/README.md](contracts/subscription-manager/README.md) for detailed integration examples.

---

## 🌟 Why This Matters

Privacy is not just a feature; it is a **fundamental requirement** for the mass adoption of blockchain in global finance. StreamPay enables businesses to pay their employees, settle vendor invoices, and manage subscriptions with the same level of confidentiality they expect from traditional banking, but with the speed, efficiency, and transparency of the Solana network.

**We are moving blockchain payments from public novelty to professional financial standard.**
