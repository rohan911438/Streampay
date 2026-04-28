-- Webhook-backed payments table for persisted Dodo payment events
-- PostgreSQL 13+

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_id UUID,
  subscription_id UUID,
  provider_payment_id TEXT NOT NULL UNIQUE,
  provider_event_id TEXT,
  provider TEXT NOT NULL DEFAULT 'dodo',
  transaction_reference TEXT,
  amount_usdc NUMERIC(18, 6) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USDC',
  customer_email TEXT,
  wallet_address TEXT,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT payments_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT payments_plan_fk FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL,
  CONSTRAINT payments_subscription_fk FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
  CONSTRAINT payments_amount_non_negative CHECK (amount_usdc >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_event_id_unique
  ON payments (provider_event_id)
  WHERE provider_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_user_paid_at
  ON payments (user_id, paid_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_subscription_paid_at
  ON payments (subscription_id, paid_at DESC);
