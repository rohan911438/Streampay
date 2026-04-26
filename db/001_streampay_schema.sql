-- StreamPay core schema (development-friendly baseline)
-- PostgreSQL 13+

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_wallet_address_not_blank CHECK (length(trim(wallet_address)) > 0)
);

CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price_usdc NUMERIC(18, 6) NOT NULL,
  billing_interval TEXT NOT NULL,
  description TEXT,
  dodo_product_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT plans_price_non_negative CHECK (price_usdc >= 0),
  CONSTRAINT plans_billing_interval_valid CHECK (billing_interval IN ('monthly', 'yearly')),
  CONSTRAINT plans_name_not_blank CHECK (length(trim(name)) > 0),
  CONSTRAINT plans_dodo_product_id_unique UNIQUE (dodo_product_id)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL,
  status TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_billing_date TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT subscriptions_status_valid CHECK (status IN ('active', 'canceled', 'pending')),
  CONSTRAINT subscriptions_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT subscriptions_plan_fk FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subscription_id UUID,
  amount_usdc NUMERIC(18, 6),
  event_type TEXT NOT NULL,
  provider_event_id TEXT,
  payload JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT subscription_events_amount_non_negative CHECK (amount_usdc IS NULL OR amount_usdc >= 0),
  CONSTRAINT subscription_events_type_valid CHECK (
    event_type IN (
      'payment_success',
      'payment_failed',
      'webhook_received',
      'webhook_processed',
      'subscription_created',
      'subscription_canceled'
    )
  ),
  CONSTRAINT subscription_events_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT subscription_events_subscription_fk FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
  CONSTRAINT subscription_events_provider_event_id_unique UNIQUE (provider_event_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
  ON subscriptions (user_id, status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing
  ON subscriptions (next_billing_date)
  WHERE status IN ('active', 'pending');

CREATE INDEX IF NOT EXISTS idx_subscription_events_user_occurred
  ON subscription_events (user_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscription_events_subscription_occurred
  ON subscription_events (subscription_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscription_events_type_occurred
  ON subscription_events (event_type, occurred_at DESC);
