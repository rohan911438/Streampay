-- StreamPay: Private transactions table for Cloak SDK integration
-- Tracks shielded transfers and their metadata

CREATE TABLE IF NOT EXISTS private_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subscription_id UUID,
  sender_address TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  amount_usdc NUMERIC(18, 6) NOT NULL,
  transaction_signature TEXT NOT NULL UNIQUE,
  transaction_reference TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  confirmation_status TEXT,
  confirmations INTEGER DEFAULT 0,
  slot BIGINT,
  metadata JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  CONSTRAINT private_transactions_amount_positive CHECK (amount_usdc > 0),
  CONSTRAINT private_transactions_status_valid CHECK (status IN ('pending', 'confirmed', 'failed')),
  CONSTRAINT private_transactions_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT private_transactions_subscription_fk FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_private_transactions_user_status
  ON private_transactions (user_id, status);

CREATE INDEX IF NOT EXISTS idx_private_transactions_subscription_status
  ON private_transactions (subscription_id, status);

CREATE INDEX IF NOT EXISTS idx_private_transactions_tx_signature
  ON private_transactions (transaction_signature);

CREATE INDEX IF NOT EXISTS idx_private_transactions_created
  ON private_transactions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_private_transactions_status_updated
  ON private_transactions (status, updated_at DESC);

-- Allows queries like: find pending transactions that haven't been confirmed recently
CREATE INDEX IF NOT EXISTS idx_private_transactions_pending_old
  ON private_transactions (created_at ASC)
  WHERE status = 'pending' AND created_at < NOW() - INTERVAL '10 minutes';
