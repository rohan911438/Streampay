-- StreamPay: Merchant-based architecture
-- Introduces support for multiple businesses/developers

CREATE TABLE IF NOT EXISTS merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  wallet_address TEXT,
  webhook_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT merchants_name_not_blank CHECK (length(trim(name)) > 0),
  CONSTRAINT merchants_api_key_not_blank CHECK (length(trim(api_key)) > 0)
);

-- Add merchant_id to existing tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE;
ALTER TABLE private_transactions ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE;
ALTER TABLE checkout_sessions ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_merchant_id ON users(merchant_id);
CREATE INDEX IF NOT EXISTS idx_plans_merchant_id ON plans(merchant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_merchant_id ON subscriptions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_payments_merchant_id ON payments(merchant_id);
CREATE INDEX IF NOT EXISTS idx_private_transactions_merchant_id ON private_transactions(merchant_id);

-- Insert a default "Demo Merchant" for the hybrid system
-- Using a fixed UUID for the demo merchant to ensure consistency across environments
INSERT INTO merchants (id, name, api_key)
VALUES ('00000000-0000-0000-0000-000000000000', 'Demo Merchant', 'sp_live_demo_6b4a2d8e1c')
ON CONFLICT (id) DO NOTHING;

-- Link existing records to the Demo Merchant
UPDATE users SET merchant_id = '00000000-0000-0000-0000-000000000000' WHERE merchant_id IS NULL;
UPDATE plans SET merchant_id = '00000000-0000-0000-0000-000000000000' WHERE merchant_id IS NULL;
UPDATE subscriptions SET merchant_id = '00000000-0000-0000-0000-000000000000' WHERE merchant_id IS NULL;
UPDATE payments SET merchant_id = '00000000-0000-0000-0000-000000000000' WHERE merchant_id IS NULL;
UPDATE private_transactions SET merchant_id = '00000000-0000-0000-0000-000000000000' WHERE merchant_id IS NULL;
UPDATE checkout_sessions SET merchant_id = '00000000-0000-0000-0000-000000000000' WHERE merchant_id IS NULL;
