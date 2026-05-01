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

## Overview

StreamPay isn't just another payment gateway; it's the missing link between the sovereign freedom of decentralized finance and the non-negotiable privacy of global commerce. We've built the infrastructure that finally allows businesses to scale on-chain without stripping away their competitive confidentiality.

### The Problem
Traditional crypto payments suffer from a fundamental paradox: they offer borderless efficiency but demand total transparency. 
*   **The Exposure Trap:** In a world where every transaction is public, payroll becomes a security risk, vendor relationships become open secrets, and business strategy is laid bare for competitors to see.
*   **The Fragmentation Wall:** Cross-chain liquidity is trapped in silos. Forcing a user to bridge, swap, and sign multiple times to make a simple payment is the antithesis of a professional user experience.
*   **The Infrastructure Void:** Most "solutions" are either fully transparent or too complex for real-world accounting. Merchants are left choosing between privacy and usability.

### The Solution: Our Discovery
We realized that privacy doesn't require complex zero-knowledge proofs for every single micro-interaction. Instead, we pioneered **Metadata Abstraction**.
*   **Decoupled Execution:** By separating the raw on-chain settlement from the sensitive payment intent, we achieve "private-like" confidentiality. The chain sees a successful transfer; only the parties involved see the *why*, the *who*, and the *context*.
*   **Seamless Cross-Chain Settlement:** We've unified the multi-chain landscape. Users pay with what they have; merchants receive what they need. No manual bridging, no friction—just pure, high-velocity commerce.
*   **Professional Standard:** We are moving blockchain payments from a "public novelty" to a "professional financial standard," giving businesses the tools to operate at scale with confidence.

---

## How It Works: User Workflow

We've engineered a high-orchestration pipeline that turns a complex multi-chain journey into a single, elegant interaction for the user:

```mermaid
graph LR
    subgraph "Phase 1: User Intent"
    A[Connect Wallet] --> B[Select Asset & Chain]
    B --> C[Confirm Amount]
    end
    
    subgraph "Phase 2: Automated Orchestration"
    C --> D[LI.FI - Route Discovery]
    D --> E[Jupiter - Atomic Swap]
    end
    
    subgraph "Phase 3: Shielded Settlement"
    E --> F[Solana Execution]
    F --> G[Cloak Privacy Layer]
    G --> H[(Metadata Vault)]
    end
    
    subgraph "Phase 4: Final Outcome"
    H --> I[User Confirmation]
    H --> J[Merchant Dashboard]
    end
```

1.  **Connect & Select:** The user connects their wallet (e.g., Phantom, Metamask) and selects any asset on any supported chain (Ethereum, Base, Solana, etc.).
2.  **Intelligent Discovery:** Our integration with **LI.FI** instantly discovers the most cost-effective and secure path across the ecosystem for the specific payment amount.
3.  **One-Click Authorization:** The user signs a single transaction. StreamPay handles the bridge, the swap via **Jupiter**, and the final payment settlement automatically.
4.  **Shielded Settlement:** The payment is finalized on Solana. To any observer, it's just another fast transaction; the sensitive details are shielded from the public ledger.
5.  **Metadata Vaulting:** While the transaction settles, the rich data—invoice IDs and purpose—is securely vaulted off-chain, ensuring private accounting.
6.  **Real-Time Confirmation:** The merchant and user both receive instant confirmation. The merchant dashboard updates with the full "Single Source of Truth."

---


## Features

*   **🔐 Privacy Abstraction Layer:** Our core innovation that decouples sensitive metadata from public on-chain execution.
*   **🌉 Cross-Chain Payments:** Seamlessly accept assets from any EVM or non-EVM chain via **LI.FI** routing.
*   **⚡ Fast Swaps via Jupiter:** Instant, low-slippage conversion into your target settlement asset.
*   **💼 Merchant Dashboard:** A professional-grade console for tracking revenue, managing plans, and monitoring private subscriptions.
*   **🔗 Wallet-Based Payments:** Full support for industry-standard wallets like **Phantom** and Metamask.
*   **📡 Webhook Support:** Real-time event notifications to sync your backend with every private payment.
*   **🧾 Subscription Tracking:** Advanced logic for managing recurring billing cycles without exposing customer data.
*   **🧠 Developer SDK Integration:** A developer-first approach with a robust SDK for integrating StreamPay into any application.

---

## Hackathon Tracks Implemented

StreamPay is a multi-disciplinary powerhouse, intentionally designed to span the most critical tracks in the Solana ecosystem. We have applied for **7 strategic tracks**, each representing a core pillar of our infrastructure.

### **1. Cloak: Privacy-Focused Payment Abstraction**
Cloak is the heart of our privacy promise. By utilizing Cloak's abstraction layer, we ensure that while the settlement is verified on the blockchain, the *intent* and *identity* behind the payment remain shielded. This allows businesses to operate with the same confidentiality they expect from traditional banking, but with the sovereign power of Solana.

### **2. RPC Fast: High-Octane Transaction Execution**
Speed is a feature, not an afterthought. We utilize **RPC Fast** as our primary gateway to the Solana network. This ensures that our cross-chain swaps and shielded settlements are broadcast and confirmed with sub-second latency. Without RPC Fast's enterprise-grade reliability, the seamless "One-Click" experience of StreamPay wouldn't be possible.

### **3. MagicBlock: Private Execution Layer Concept**
We've integrated **MagicBlock** concepts to handle complex execution states in a private manner. This allows us to manage subscription logic and payment verification without leaking state information to public explorers, further hardening the privacy of our merchant-customer relationships.

### **4. Dune: On-Chain Data and Analytics**
Data-driven decisions shouldn't require compromising privacy. We leverage **Dune** to provide aggregate, non-sensitive insights into the health of the StreamPay ecosystem. This gives merchants the macro-level data they need—revenue trends, active user counts, and growth metrics—while our metadata layer protects the micro-level privacy.

### **5. LI.FI: The Cross-Chain Routing Backbone**
**LI.FI** is the bridge that brings the entire multi-chain world to StreamPay. By integrating their route discovery and bridging infrastructure, we've made it possible for a user on Ethereum or Base to pay a StreamPay merchant on Solana as easily as if they were on the same chain. It is the foundation of our "Pay with Anything" philosophy.

### **6. Jupiter: Swap Aggregation & Liquidity**
The final mile of every StreamPay transaction is handled by **Jupiter**. Their swap aggregation ensures that regardless of what asset the user sends, the merchant receives their settled funds with the best possible price and minimal slippage. Jupiter is the engine that makes our unified Solana settlement both viable and highly efficient.

### **7. Dodo Payments: Public Fallback & Global Reach**
For users and regions where traditional blockchain transparency is required or preferred, we've integrated **Dodo Payments**. This provides a robust public fallback path, ensuring that StreamPay remains a globally accessible platform that can accommodate any regulatory or personal preference without friction.

---

---

## Architecture

StreamPay is engineered as a high-fidelity payment orchestration ecosystem. Our architecture is designed to handle the entire lifecycle of a transaction—from multi-chain intake and liquidity routing to shielded settlement and automated merchant reporting.

```mermaid
graph TD
    User([User / Payer]) --> WebApp[Next.js Frontend]
    Developer([External Developer]) --> SDK[StreamPay SDK / API]
    
    subgraph "Intake & Routing"
    WebApp & SDK --> Orch{Orchestration Engine}
    Orch --> LIFI[LI.FI Bridge & Swap]
    LIFI --> Jup[Jupiter Liquidity Aggregator]
    end
    
    subgraph "Execution Layer (Solana)"
    Jup --> Router[Payment Router Program]
    Router --> SubMgr[Subscription Manager Program]
    Router --> RPC[RPC Fast Infrastructure]
    end
    
    subgraph "Privacy & Persistence"
    Router --> Cloak[Cloak SDK - Shielded TX]
    Cloak --> Vault[(Secure Metadata Vault)]
    Vault --> Keys[Viewing Keys / Selective Audit]
    end
    
    subgraph "Merchant Ecosystem"
    Vault --> Dash[Merchant Dashboard]
    Dash --> Dune[Dune Analytics Dashboards]
    Router -.-> Dodo[Dodo Payment Fallback]
    Vault --> Webhooks[Webhook Engine]
    Webhooks --> ExtSrv[External Merchant Services]
    end
```

### Technical Component Breakdown

*   **Intake & Orchestration:** A unified entry point for both our native web app and third-party integrations via the **StreamPay SDK**. It leverages **LI.FI** for intelligent route discovery and **Jupiter** for atomic, zero-slippage swaps into the settlement currency.
*   **On-Chain Execution (Solana):** Our dual-program architecture—**Payment Router** and **Subscription Manager**—manages the complex state of recurring billing and one-time payments. All interactions are routed through **RPC Fast** to guarantee enterprise-grade performance and sub-second finality.
*   **The Privacy Engine:** Powered by the **Cloak SDK**, this layer executes shielded transactions that decouple the public ledger from sensitive payment details. We support **Selective Auditability** through viewing keys, allowing merchants to remain compliant while keeping their data private.
*   **Persistence & Persistence:** The **Metadata Vault** is our secure off-chain layer that bridges the gap between raw blockchain hashes and human-readable business data. 
*   **The Merchant Ecosystem:** A full-stack suite including a **Next.js Console**, **Dune Analytics** for aggregate insights, and a robust **Webhook Engine** that triggers external merchant services (ERP, CRM, etc.) upon payment confirmation.

---


All transactions generated through our **Cloak** and **MagicBlock** execution layers are routed through RPC Fast to guarantee the best possible performance and delivery success rate.

---

## Getting Started

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

## Demo Flow

1. **Connect**: Open the application and connect your Solana wallet.
2. **Select Plan**: Browse available subscription plans on the demo page (`/pay/demo`).
3. **Private Checkout**: Notice that **Private Payment (Cloak)** is pre-selected as the recommended method.
4. **Pay**: Execute the transaction. You will see a "Securing Privacy..." loading state.
5. **Success**: Receive a confirmation message explaining that your payment was successful and that your details are hidden on-chain.
6. **Verify**: Check the Merchant Dashboard to see your new private subscription active and tagged with a 🔒 badge.

---

## Payment Router Contract Deployment

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

## Subscription Manager Contract Deployment

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

## Why This Matters

Privacy is not just a feature; it is a **fundamental requirement** for the mass adoption of blockchain in global finance. StreamPay enables businesses to pay their employees, settle vendor invoices, and manage subscriptions with the same level of confidentiality they expect from traditional banking, but with the speed, efficiency, and transparency of the Solana network.

**We are moving blockchain payments from public novelty to professional financial standard.**
