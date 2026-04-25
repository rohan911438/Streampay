# PayStream

PayStream is a Solana-native recurring payments application built in a monorepo.

Current scope includes:
- Next.js web app with merchant and subscriber sections.
- Shared Solana blockchain layer for reusable RPC connection and constants.
- Phantom wallet adapter integration in the frontend.

## Tech Stack

- Next.js 14 (App Router) + TypeScript
- React 18
- Tailwind CSS
- Solana Wallet Adapter (Phantom)
- @solana/web3.js

## Monorepo Structure

```text
.
├── apps/
│   └── web/                 # Next.js frontend (and integrated API backend capability)
├── packages/
│   └── solana/              # Shared Solana RPC + constants layer
├── .env.example
├── package.json
└── paystream_redesigned_plan.md
```

## Implemented Routes

- /dashboard
- /plans
- /analytics
- /pay/[slug] (demo example: /pay/demo)

## Environment Variables

Create a local env file from .env.example.

Required values:

- SOLANA_RPC_URL
- NEXT_PUBLIC_SOLANA_RPC_URL
- DODO_API_KEY
- DODO_SUBSCRIPTION_PRODUCT_ID
- DODO_WEBHOOK_SECRET

Use your custom RPC provider URL (Helius, QuickNode, etc.).
For consistency, set both values to the same endpoint.

Optional Dodo values:

- DODO_API_BASE_URL (defaults to `https://test.dodopayments.com`)
- DODO_SUCCESS_URL
- DODO_CANCEL_URL

Webhook setup:

- Configure Dodo to send events to `https://your-domain/api/webhooks/dodo`.
- The endpoint accepts `payment.succeeded`, `subscription.active`, and `subscription.renewed` events.
- Set `DODO_WEBHOOK_SECRET` to the signing secret from Dodo so incoming requests can be verified.

## Dodo Checkout API

Backend endpoint:

- `POST /api/dodo/create-checkout`

Request body:

```json
{
	"email": "subscriber@example.com",
	"name": "Subscriber Name"
}
```

Behavior:

- Uses server-side `DODO_API_KEY` to authenticate with Dodo Payments (test mode).
- Uses predefined `DODO_SUBSCRIPTION_PRODUCT_ID` for checkout session creation.
- Returns only the `checkout_url` needed by the frontend.

Success response:

```json
{
	"checkout_url": "https://..."
}
```

## Dodo Webhook API

Backend endpoint:

- `POST /api/webhooks/dodo`

Behavior:

- Verifies the request signature with `DODO_WEBHOOK_SECRET` before parsing the payload.
- Logs the event type and key identifiers such as subscription ID and customer email.
- Updates the in-memory subscription snapshot used by the merchant dashboard.
- Returns a small acknowledgement payload after the event is recorded.

## How To Run Locally

### 1) Install dependencies

From the repository root:

```bash
npm install --legacy-peer-deps --no-audit --no-fund
```

### 2) Start development server

```bash
npm run dev
```

App URL:

```text
http://localhost:3000
```

### 3) Production build

```bash
npm run build
```

### 4) Start production server

```bash
npm run start
```

## Windows PowerShell Note

If your system blocks npm.ps1 execution, use `npm.cmd` directly in PowerShell:

```powershell
npm.cmd run dev
```

You can also run via `cmd` explicitly:

```powershell
cmd /c "cd /d c:\Users\dell\Desktop\Solana Hackathon && npm run dev"
```

Same pattern works for build/start:

```powershell
cmd /c "cd /d c:\Users\dell\Desktop\Solana Hackathon && npm run build"
cmd /c "cd /d c:\Users\dell\Desktop\Solana Hackathon && npm run start"
```

## Shared Solana Layer

The shared blockchain module lives in packages/solana and provides:

- Centralized Connection instance with confirmed commitment.
- Environment-driven RPC URL.
- Reusable constants for USDC devnet mint and SPL-related program IDs.

This ensures all services use the same Solana network configuration.
