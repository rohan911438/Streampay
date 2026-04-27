# Payment Simulation Testing Guide

This document describes the temporary payment simulation system for testing StreamPay without Dodo webhook integration.

## Overview

The payment simulation system allows you to test the complete subscription flow:
1. Create a subscription (initialize payment)
2. Simulate successful payment completion
3. Verify subscription activation and payment records in the database
4. View activity on the merchant dashboard

## Components

### 1. Simulation API Endpoint
**Location:** `/api/testing/simulate-payment`

**Method:** `POST`

**Purpose:** Temporarily marks a subscription as active and records payment events. Will be replaced with real Dodo webhooks in production.

**Query Parameters:**
```
subscriptionId    - UUID of subscription to activate (optional if walletAddress provided)
walletAddress     - Solana wallet address to find subscription for (optional if subscriptionId provided)
checkoutSessionId - Checkout session ID to mark as completed (optional)
amountUsdc        - Payment amount in USDC (optional - uses plan price if not provided)
```

**Example Requests:**
```bash
# Using subscription ID
curl -X POST "http://localhost:3000/api/testing/simulate-payment?subscriptionId=<uuid>"

# Using wallet address
curl -X POST "http://localhost:3000/api/testing/simulate-payment?walletAddress=<wallet>&amountUsdc=49"

# With checkout session
curl -X POST "http://localhost:3000/api/testing/simulate-payment?subscriptionId=<uuid>&checkoutSessionId=<id>"
```

**Response:**
```json
{
  "ok": true,
  "subscriptionId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "active",
  "amount": 49,
  "checkoutSessionUpdated": true,
  "warning": "This is a temporary testing endpoint. Real webhook updates will replace this."
}
```

### 2. Success Page with Auto-Simulation
**Location:** `/pay/success`

**Parameters:**
```
test=true                    - Enables automatic payment simulation
subscription_id=<uuid>       - Subscription to activate (optional)
checkout_session_id=<id>     - Checkout session to complete (optional)
```

**Flow:**
1. User completes checkout (or test button is clicked)
2. Redirected to `/pay/success?test=true&subscription_id=<uuid>`
3. Page automatically calls the simulation API
4. Subscription is marked as active
5. Payment event is recorded
6. User sees success confirmation with "Testing Mode" indicator

### 3. Demo Payment Button
**Location:** `/pay/[slug]` page (only visible when `slug=demo`)

**Feature:** The "🧪 Test Payment (Demo)" button appears only in demo mode and:
1. Creates a pending subscription via `/api/dodo/create-checkout`
2. Redirects to success page with `test=true` flag
3. Automatically simulates payment completion

## Usage Workflow

### Quick Test (Using Demo Mode)

1. Navigate to `/pay/demo` in your browser
2. Connect your Solana wallet
3. Click "🧪 Test Payment (Demo)" button
4. Watch the success page simulate the payment
5. Check the dashboard to see your active subscription

### Manual API Test

1. Create a subscription first:
```bash
curl -X POST "http://localhost:3000/api/dodo/create-checkout" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "walletAddress": "<your-wallet>"
  }'
```

2. Note the `subscription_id` from the response

3. Simulate payment:
```bash
curl -X POST "http://localhost:3000/api/testing/simulate-payment?subscriptionId=<subscription_id>"
```

4. Verify in database:
```sql
SELECT * FROM subscriptions WHERE id = '<subscription_id>';
SELECT * FROM subscription_events WHERE subscription_id = '<subscription_id>';
SELECT * FROM checkout_sessions WHERE subscription_id = '<subscription_id>';
```

## Database Updates

When a payment is simulated, the following updates occur:

**subscriptions table:**
- `status` → `'active'`
- `updated_at` → current timestamp

**subscription_events table:**
- New row inserted with `event_type: 'payment_success'`
- `amount_usdc` set to plan price or provided amount
- `payload` contains testing metadata

**checkout_sessions table (if `checkoutSessionId` provided):**
- `status` → `'completed'`
- `updated_at` → current timestamp
- `completed_at` → current timestamp

## Dashboard Effects

Once a subscription is marked active:
- Dashboard shows the subscription in "Active Subscriptions"
- Payment appears in "Recent Transactions" section
- Metrics update: total revenue, active subscriptions, etc.

## Temporary Nature

⚠️ **Important:** This simulation system is temporary and will be replaced with real Dodo webhook integration.

**Migration Path:**
1. Current: API calls simulation endpoint manually or from `/pay/success?test=true`
2. Future: Dodo sends webhooks to `/api/webhooks/dodo`
3. Webhook handler updates subscriptions and records payments
4. Testing endpoint deprecated and removed

**Marked For Replacement:**
- All simulation code clearly labeled with `TEMPORARY TESTING` comments
- Separate test API route under `/api/testing/`
- Demo mode conditional in payment components
- Easy to identify and remove when webhooks are ready

## Environment Variables

No additional environment variables needed for testing. The simulation uses:
- Existing `DATABASE_URL` for database access
- No external service calls (unlike real Dodo checkout)

## Troubleshooting

### "Could not find a subscription to activate"
- Ensure subscription exists in database
- Verify `subscriptionId` or `walletAddress` is correct
- Check that subscription status is not already active

### "Invalid Solana wallet address"
- Verify wallet address format (44 characters, base58)
- Use correct address from connected wallet

### Database errors
- Ensure `DATABASE_URL` is configured
- Verify database is running and accessible
- Check that schema tables exist

## Future Webhook Integration

When replacing with real webhooks:

1. **Keep the database schema** - subscription/payment events are already structured correctly
2. **Update webhook handler** - `/api/webhooks/dodo/route.ts` already has status mapping logic
3. **Remove test endpoint** - Delete `/api/testing/simulate-payment/route.ts`
4. **Remove demo button** - Remove `test mode` conditional from `payment-prep.tsx`
5. **Update success page** - Remove auto-simulation logic from `/pay/success/page.tsx`

The webhook implementation is already partially prepared with:
- `mapEventTypeToCheckoutStatus()` - converts Dodo events to checkout statuses
- `updateCheckoutSessionRecordStatus()` - updates checkout session tracking
- Event payload structure compatible with testing events
