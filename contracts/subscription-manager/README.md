# StreamPay Subscription Manager

This is a separate Anchor program for subscription lifecycle state only.

## Instructions

- `create_subscription_plan` lets a merchant register a plan with `plan_id`, `amount`, and `duration_seconds`.
- `activate_subscription` creates a subscription after a confirmed payment and stores the linked `PaymentRecord` pubkey.
- `renew_subscription` extends the active period after a renewal payment is confirmed.

## Accounts

- `SubscriptionPlan` stores merchant, plan ID, amount, and duration.
- `Subscription` stores user, merchant, plan ID, amount, payment record link, start/end timestamps, and status.
- `PaymentRecord` is included as a minimal reference account for activation and renewal checks.

## Notes

- No payment execution, privacy logic, pricing, or cross-chain routing is included here.
- This folder is meant to be deployed separately in Solana Playground as its own program.