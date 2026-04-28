# StreamPay: Privacy-First Payments on Solana
### Shielded subscriptions for the real world.

StreamPay is a privacy-first payment platform built on Solana that enables businesses and individuals to execute recurring payments without exposing sensitive financial data. By integrating **Cloak** as our primary transaction layer, we’ve built a solution where payment amounts and recipients remain shielded on-chain, while maintaining optional auditability for compliance.

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

To ensure that StreamPay remains "seamless and fast," we utilize **RPC Fast**. This infrastructure layer provides:
- **Low Latency**: Near-instant transaction broadcasting and confirmation.
- **Consistency**: High uptime and reliability, ensuring that subscription renewals and one-time payments never fail due to network congestion.

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

## 🌟 Why This Matters

Privacy is not just a feature; it is a **fundamental requirement** for the mass adoption of blockchain in global finance. StreamPay enables businesses to pay their employees, settle vendor invoices, and manage subscriptions with the same level of confidentiality they expect from traditional banking, but with the speed, efficiency, and transparency of the Solana network.

**We are moving blockchain payments from public novelty to professional financial standard.**
