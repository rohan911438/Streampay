-- StreamPay: Update payments table with status and type
-- Adds missing columns for payment tracking and security

ALTER TABLE payments ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'public';

-- Add constraint for status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_status_valid') THEN
        ALTER TABLE payments ADD CONSTRAINT payments_status_valid CHECK (status IN ('pending', 'success', 'completed', 'failed'));
    END IF;
END
$$;

-- Add constraint for type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_type_valid') THEN
        ALTER TABLE payments ADD CONSTRAINT payments_type_valid CHECK (type IN ('public', 'private'));
    END IF;
END
$$;

-- Update existing private payments based on execution_layer or provider
UPDATE payments SET type = 'private' WHERE execution_layer = 'magicblock' OR provider = 'cloak';
UPDATE payments SET status = 'completed' WHERE paid_at IS NOT NULL AND status = 'pending';
