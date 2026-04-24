# PayStream — Redesigned System Plan (No KIRAPAY, No Cross-Chain)

---

## 1. What PayStream Is Now

> A Solana-native recurring payments platform. Merchants create subscription plans. Users pay in USDC on Solana. An autonomous agent handles renewals. Analytics power smart decisions. Optionally, idle merchant funds earn yield.

**One-liner for judges:** "Stripe-style recurring billing, built natively on Solana."

No bridges. No cross-chain. No unnecessary complexity. Pure Solana.

---

## 2. Track Mapping (Explicit)

| Track | How PayStream satisfies it | Integration point |
|---|---|---|
| **Dodo Payments** | Core billing layer — plans, subscriptions, invoices, recurring USDC billing | Merchant dashboard + subscriber checkout |
| **Dune Analytics** | Live wallet balance, tx history, MRR dashboard | Analytics page — SIM API calls |
| **Zerion Agent** | Autonomous renewal agent, spend limit + retry policies, real Solana tx | Background agent process |
| **RPC Fast Track** | ALL Solana RPC calls go through custom RPC endpoint (Helius/QuickNode/Triton) | Blockchain layer — hardcoded in config |
| **LPAgent (optional)** | Merchant idle USDC → deployed into liquidity pool via Zap In | Optional yield tab in dashboard |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   PAYSTREAM SYSTEM                      │
│                                                         │
│  ┌──────────────────┐      ┌─────────────────────────┐  │
│  │  NEXT.JS FRONTEND │      │   AGENT SERVICE         │  │
│  │                  │      │   (Node.js / Railway)   │  │
│  │  - Merchant dash │      │   - Renewal cron        │  │
│  │  - Checkout page │      │   - Policy engine       │  │
│  │  - Analytics     │      │   - Solana tx sender    │  │
│  │  - (Yield tab)   │      │   - LP deploy (opt.)    │  │
│  └────────┬─────────┘      └───────────┬─────────────┘  │
│           │                            │                │
│  ┌────────▼────────────────────────────▼─────────────┐  │
│  │               BACKEND API (tRPC / Next.js)        │  │
│  │  /merchants  /plans  /subscriptions  /payments    │  │
│  │  /webhooks  /analytics  /agent  /yield            │  │
│  └──────┬──────────┬──────────┬──────────┬───────────┘  │
│         │          │          │          │              │
│  ┌──────▼──┐ ┌─────▼──┐ ┌────▼───┐ ┌───▼──────────┐   │
│  │  DODO   │ │  DUNE  │ │ ZERION │ │  SOLANA RPC  │   │
│  │PAYMENTS │ │  SIM   │ │  CLI   │ │  (Custom)    │   │
│  └─────────┘ └────────┘ └────────┘ └──────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │         POSTGRESQL (Supabase)                   │   │
│  │  merchants | plans | subscriptions | payments   │   │
│  │  policy_configs | agent_logs | yield_positions  │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Folder Structure

```
paystream/
├── apps/
│   ├── web/                          # Next.js 14 frontend
│   │   ├── app/
│   │   │   ├── (merchant)/
│   │   │   │   ├── dashboard/        # MRR, subscriber list
│   │   │   │   ├── plans/            # Create/manage plans
│   │   │   │   ├── analytics/        # Dune SIM dashboard
│   │   │   │   └── yield/            # LPAgent tab (optional)
│   │   │   ├── (subscriber)/
│   │   │   │   └── pay/[slug]/       # Public checkout page
│   │   │   └── api/
│   │   │       ├── webhooks/
│   │   │       │   ├── dodo/         # Dodo payment webhooks
│   │   │       │   └── solana/       # On-chain confirmation listener
│   │   │       └── trpc/             # tRPC router
│   │   └── components/
│   │       ├── checkout/             # Wallet connect + pay button
│   │       ├── dashboard/            # Merchant widgets
│   │       └── analytics/            # Recharts components
│   │
│   └── agent/                        # Zerion autonomous agent (separate process)
│       ├── src/
│       │   ├── agent.ts              # Main cron loop
│       │   ├── policies/
│       │   │   ├── SpendLimitPolicy.ts
│       │   │   ├── RetryPolicy.ts
│       │   │   └── index.ts
│       │   ├── executor/
│       │   │   └── solanaExecutor.ts # Builds + signs Solana txns
│       │   └── yield/
│       │       └── lpAgent.ts        # LPAgent integration (optional)
│       └── package.json
│
├── packages/
│   ├── db/                           # Prisma schema + client
│   │   └── schema.prisma
│   ├── solana/                       # Shared Solana utilities
│   │   ├── rpc.ts                    # Custom RPC client (RPC Fast Track)
│   │   ├── transfer.ts               # USDC SPL transfer builder
│   │   └── constants.ts              # USDC mint, program IDs
│   └── types/                        # Shared TypeScript types
│
├── .env.example
└── turbo.json                        # Turborepo monorepo config
```

---

## 5. Core Flow (Step-by-Step)

```
STEP 1: Merchant creates plan
  → Dashboard form → POST /api/plans
  → Stored in PostgreSQL
  → Synced to Dodo: POST /subscriptions/plans
  → Returns shareable link: paystream.app/pay/[merchant-slug]

STEP 2: Subscriber opens checkout page
  → Phantom wallet connect (via @solana/wallet-adapter)
  → Plan details fetched from DB
  → USDC balance shown (via custom RPC endpoint)

STEP 3: Subscriber pays
  → Frontend builds SPL USDC transfer instruction
  → Transaction signed by subscriber's Phantom wallet
  → Submitted to Solana via CUSTOM RPC endpoint (RPC Fast Track)
  → Await confirmation

STEP 4: Payment confirmed
  → On-chain listener (or RPC polling) detects confirmed tx
  → POST /api/webhooks/solana with tx_hash
  → Payment recorded in PostgreSQL

STEP 5: Subscription activated
  → PayStream calls Dodo API: POST /subscriptions
  → Dodo creates subscription + generates invoice
  → Subscriber status: ACTIVE
  → next_renewal_at = now + 30 days
  → BullMQ job enqueued for renewal

STEP 6: Agent handles renewal (Zerion)
  → Agent cron fires hourly
  → Queries DB for subscriptions due
  → Evaluates policies (spend limit, retry count)
  → Executes Solana SPL USDC transfer if policies pass
  → Records tx_hash, updates next_renewal_at

STEP 7: Analytics (Dune SIM)
  → Merchant dashboard calls /api/analytics
  → Backend fetches: wallet balance, tx history from Dune SIM
  → Returns: MRR, churn risk, payment velocity

STEP 8: Optional yield (LPAgent)
  → Merchant enables yield on idle USDC balance
  → Agent calls LPAgent "Zap In" with idle amount
  → Position tracked in DB + shown on yield tab
```

---

## 6. RPC Fast Track — Implementation

This is infrastructure. It takes 30 minutes to implement and satisfies the entire track.

```typescript
// packages/solana/rpc.ts
import { Connection } from "@solana/web3.js";

const RPC_ENDPOINT = process.env.SOLANA_RPC_URL!;
// Use: Helius, QuickNode, Triton, or any RPC Fast Track provider

export const connection = new Connection(RPC_ENDPOINT, {
  commitment: "confirmed",
  confirmTransactionInitialTimeout: 30000,
});

// Every Solana interaction in the codebase imports from here.
// This single file is your RPC Fast Track proof.
```

**In your README:** "All Solana RPC calls are routed through a custom [Provider] endpoint for guaranteed throughput and low latency. The `packages/solana/rpc.ts` module is the single source of truth for all blockchain communication."

That sentence alone satisfies the track. The key requirement is: no default public RPC.

---

## 7. Dune SIM — What to Call and Why

```
Endpoint 1: GET /v1/solana/account/{merchant_wallet}/balances
  → Shows merchant's current USDC balance on Solana
  → Used in: Revenue widget, yield eligibility check

Endpoint 2: GET /v1/solana/account/{merchant_wallet}/transactions
  → Shows all incoming USDC payments
  → Used in: Payment history timeline, MRR calculation

Endpoint 3: GET /v1/solana/account/{subscriber_wallet}/balances
  → Shows subscriber's USDC balance
  → Used in: Churn risk indicator (balance < 2x plan cost = yellow flag)

Dashboard widgets:
  - MRR line chart (30 days of payments from SIM tx history)
  - Subscriber wallet health grid (color-coded by balance)
  - Payment velocity chart (daily payment count)
  - Total revenue counter (cumulative USDC received)
```

**During demo:** Open browser DevTools → Network tab → show SIM requests firing live. This is the proof judges need.

---

## 8. Zerion Agent — Minimal Implementation That Wins

```typescript
// apps/agent/src/agent.ts

// Runs every hour via BullMQ or setInterval
async function runRenewalCycle() {
  const due = await db.subscriptions.findDue(); // next_renewal_at <= now + 1hr

  for (const sub of due) {
    const allowed = await evaluatePolicies(sub);

    if (allowed) {
      const txHash = await executeRenewal(sub); // Real Solana tx
      await db.agentLogs.record({ sub, action: "RENEWED", txHash });
    } else {
      await db.subscriptions.pause(sub.id);
      await db.agentLogs.record({ sub, action: "PAUSED", reason: "policy" });
    }
  }
}

// policies/SpendLimitPolicy.ts
export async function SpendLimitPolicy(sub: Subscription): Promise<boolean> {
  const monthlySpend = await db.payments.sumThisMonth(sub.subscriber_id);
  return monthlySpend + sub.plan.price_usdc <= sub.policy.monthly_cap;
}

// policies/RetryPolicy.ts
export async function RetryPolicy(sub: Subscription): Promise<boolean> {
  return sub.failure_count < 3; // Cancel after 3 consecutive failures
}

// executor/solanaExecutor.ts
export async function executeRenewal(sub: Subscription): Promise<string> {
  // Build SPL USDC transfer from subscriber wallet to merchant wallet
  // Sign with agent keypair (authorized by merchant at setup)
  // Submit via custom RPC endpoint
  // Return tx hash
}
```

**Two policies implemented. One real Solana transaction per renewal. Fully autonomous.** This satisfies every Zerion requirement.

---

## 9. LPAgent — If You Include It (Keep It Simple)

```
ONLY build this if Stage 1–4 are working and you have 4+ hours left.

What to build:
  - "Enable Yield" toggle in merchant dashboard
  - When toggled: call LPAgent Zap In API with X% of idle USDC balance
  - Show position in a simple card: "Earning ~4.2% APY on 500 USDC"
  - Agent monitors position, can withdraw if subscriber renewal is due

What NOT to build:
  - No custom AMM logic
  - No rebalancing
  - No multi-pool strategy
  - No trading interface

If it breaks or doesn't integrate cleanly → SKIP IT. 3 tracks win is better
than 4 tracks with a broken 4th.
```

---

## 10. Build Order (Stage-by-Stage)

### Stage 1 — Payment Flow (Day 1, ~6 hours)
```
Priority: CRITICAL — nothing else works without this

1. [ ] Next.js project setup (shadcn/ui + Tailwind + Privy auth)
2. [ ] Supabase schema: merchants, plans, subscriptions, payments
3. [ ] Custom RPC client in packages/solana/rpc.ts (30 min — do this first)
4. [ ] Public checkout page: /pay/[slug]
5. [ ] Phantom wallet connect + USDC balance display
6. [ ] USDC SPL transfer transaction builder + signer
7. [ ] On-chain confirmation listener (poll RPC for tx status)
8. [ ] Payment recorded in DB on confirmation

Done = money moves on Solana. Everything else is built on this.
```

### Stage 2 — Subscription System (Day 1–2, ~4 hours)
```
Priority: HIGH — core track requirement

1. [ ] Merchant dashboard shell (sidebar, nav)
2. [ ] Plan creation form → store in DB
3. [ ] Dodo API: create merchant account, create plan, create subscription
4. [ ] Dodo webhook receiver: subscription.renewed / failed / cancelled
5. [ ] BullMQ job: enqueue renewal check on subscription create
6. [ ] Subscription status UI in merchant dashboard

Done = Dodo track satisfied, merchants have a real product.
```

### Stage 3 — Analytics (Day 2, ~3 hours)
```
Priority: HIGH — Dune track, visually impressive for demo

1. [ ] Dune SIM API client (packages/dune/sim.ts)
2. [ ] Backend routes: /api/analytics/revenue, /api/analytics/subscribers
3. [ ] Analytics page with Recharts:
   - MRR line chart
   - Subscriber wallet health grid
   - Payment velocity chart
4. [ ] SWR polling for live updates (every 30 seconds)

Done = Dune track satisfied, dashboard looks like a real product.
```

### Stage 4 — Automation (Day 2–3, ~4 hours)
```
Priority: HIGH — Zerion track

1. [ ] apps/agent/ project setup (separate Node.js process)
2. [ ] SpendLimitPolicy + RetryPolicy
3. [ ] Solana executor (build + sign + submit SPL transfer)
4. [ ] Main cron loop (BullMQ or node-cron)
5. [ ] Agent logs table + log viewer in dashboard
6. [ ] Deploy agent to Railway

Done = Zerion track satisfied. System is now fully autonomous.
```

### Stage 5 — Yield Layer (Day 3+, ~2 hours, only if time)
```
Priority: OPTIONAL

1. [ ] LPAgent API integration (Zap In only)
2. [ ] "Enable Yield" toggle in merchant dashboard
3. [ ] Position card: current APY, amount deployed
4. [ ] Agent withdrawal before renewal if needed

Done = LPAgent track satisfied. Bonus points, not critical.
```

---

## 11. What to Prioritize vs Ignore

### Prioritize
- Working USDC payment on Solana (Stage 1) — non-negotiable
- Dodo subscription creation (Stage 2) — core track
- Dune SIM showing real data (Stage 3) — judges check this
- One real autonomous agent transaction (Stage 4) — Zerion requirement
- Custom RPC setup (Stage 1, 30 min) — easy win, full track credit

### Simplify (don't over-build)
- Auth: use Privy with wallet-only flow — skip email/password entirely
- Database: use Supabase hosted Postgres — no self-hosting
- Invoices: let Dodo generate them — don't build a custom invoice renderer
- Agent deployment: Railway free tier is fine for hackathon
- UI: use shadcn/ui components — don't design from scratch

### Ignore Completely
- Multi-tenant isolation (one merchant for demo is fine)
- Email notifications (webhook logs are enough)
- Mobile responsiveness (demo on desktop)
- Test coverage (no time)
- Mainnet (stay on devnet, use devnet USDC)
- Advanced charting (simple Recharts is enough)

---

## 12. Risks and Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Dodo API sandbox is slow or down | Medium | Seed DB with fake Dodo subscription IDs; show API call in logs even if response is mocked |
| Dune SIM has no data for devnet wallets | High | Use mainnet public wallets with known balances for analytics demo; explain in README |
| Zerion agent Solana tx fails on devnet | Medium | Test with very small amounts (0.01 USDC); have a pre-confirmed tx hash as backup |
| LPAgent integration is complex | High | Skip it entirely — 3 clean tracks > 4 messy tracks |
| RPC rate limits | Low | Use paid tier of Helius/QuickNode (free tiers are generous for hackathon volume) |
| BullMQ not firing in demo | Low | Also add a manual "Trigger Agent" button in dashboard for demo safety |

---

## 13. Minimal Feature Set to Still Win

If you're short on time, **this is the absolute minimum** that gives you a credible submission across all 4 tracks:

```
✅ RPC Fast Track (30 min)
   → packages/solana/rpc.ts with custom endpoint
   → One sentence in README

✅ Dodo Payments Track (4 hours)
   → Create plan → user pays USDC → Dodo subscription created → invoice shown
   → Must show Dodo API calls in network tab or logs

✅ Dune Analytics Track (3 hours)
   → Dashboard with 3 widgets powered by real SIM API calls
   → Show SIM requests firing in demo

✅ Zerion Track (3 hours)
   → Agent running as separate process
   → One real Solana devnet transaction executed
   → One policy evaluated (even if it always passes in demo)
   → Agent log visible in dashboard

TOTAL: ~10 hours of focused work for a winning 4-track submission.
```

---

## 14. Demo Strategy (5 Minutes)

```
[0:00–0:30] Hook
  "There's no Stripe for Solana. Merchants can't charge subscriptions.
   PayStream fixes that — natively on Solana, in USDC, with automation built in."

[0:30–1:30] Merchant setup
  → Create plan: "Pro Plan, 29 USDC/month"
  → Show shareable link + embed code

[1:30–2:30] Subscriber pays
  → Open checkout page
  → Connect Phantom wallet
  → Confirm USDC payment
  → Show Solana tx hash (real, on devnet)
  → Subscription activates

[2:30–3:15] Analytics
  → Switch to analytics tab
  → Show MRR chart, wallet health, payment velocity
  → "This is live data from Dune SIM API"

[3:15–4:15] Agent demo
  → Open agent terminal on Railway
  → Show: "Checking renewals... Policy: PASS... TX submitted: [hash]"
  → Show agent log in dashboard

[4:15–4:45] RPC infrastructure callout
  → Show rpc.ts config: "All transactions go through our custom RPC endpoint"
  → Show network tab: requests going to custom RPC URL

[4:45–5:00] Close
  → Dashboard showing MRR, active subscriptions, agent status: RUNNING
  → "PayStream is ready. We're the billing layer Solana was missing."
```

---

## 15. README Structure for Submission

```markdown
## Tracks

### Dodo Payments
- Subscription plans, recurring billing, USDC invoices
- API integration: [show endpoints used]

### Dune Analytics
- Live wallet data via SIM API
- Endpoints: /v1/solana/account/{}/balances, /transactions
- Dashboard: MRR, churn risk, payment velocity

### Zerion Autonomous Agent
- Forked Zerion CLI, extended with subscription engine
- Policies: SpendLimitPolicy, RetryPolicy
- Real Solana devnet tx: [paste tx hash here]

### RPC Fast Track
- Custom RPC: [provider name + endpoint format]
- Single client in packages/solana/rpc.ts
- Used for: all wallet reads, tx submission, confirmation polling
```
