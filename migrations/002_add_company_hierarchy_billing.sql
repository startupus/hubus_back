-- Migration: Add Company Hierarchy to Billing Service
-- Description: Adds hierarchical structure to companies, removes User model, updates transactions

-- =====================================================
-- Step 1: Add new columns to companies table
-- =====================================================

ALTER TABLE companies 
ADD COLUMN parent_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
ADD COLUMN billing_mode VARCHAR(20) DEFAULT 'SELF_PAID' CHECK (billing_mode IN ('SELF_PAID', 'PARENT_PAID')),
ADD COLUMN position VARCHAR(255),
ADD COLUMN department VARCHAR(255);

-- Add indexes for performance
CREATE INDEX idx_companies_parent_company_id ON companies(parent_company_id);

-- =====================================================
-- Step 2: Update Transactions table
-- =====================================================

-- Add new column for initiator
ALTER TABLE transactions
ADD COLUMN initiator_company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

-- Rename user_id to match company context (optional migration of existing data)
-- Note: If you have existing data, you may need to migrate user_id to company_id first
ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;

-- Update index
DROP INDEX IF EXISTS transactions_user_id_idx;
CREATE INDEX transactions_initiator_company_id_idx ON transactions(initiator_company_id);

-- =====================================================
-- Step 3: Update UsageEvents table
-- =====================================================

-- Add new column for initiator
ALTER TABLE usage_events
ADD COLUMN initiator_company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

-- Drop old user_id constraint
ALTER TABLE usage_events
DROP CONSTRAINT IF EXISTS usage_events_user_id_fkey;

-- Update index
DROP INDEX IF EXISTS usage_events_user_id_idx;
CREATE INDEX usage_events_initiator_company_id_idx ON usage_events(initiator_company_id);

-- =====================================================
-- Step 4: Drop User table (if exists)
-- =====================================================

DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- Step 5: Create BillingMode enum (if not exists)
-- =====================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BillingMode') THEN
        CREATE TYPE "BillingMode" AS ENUM ('SELF_PAID', 'PARENT_PAID');
    END IF;
END $$;

-- =====================================================
-- Step 6: Update existing data (if needed)
-- =====================================================

-- Set default billing mode for all existing companies
UPDATE companies SET billing_mode = 'SELF_PAID' WHERE billing_mode IS NULL;

-- For existing usage_events and transactions where userId existed,
-- you might want to set initiator_company_id = company_id
-- This depends on your data migration strategy

-- Example:
-- UPDATE usage_events SET initiator_company_id = company_id WHERE initiator_company_id IS NULL;
-- UPDATE transactions SET initiator_company_id = company_id WHERE initiator_company_id IS NULL;

-- =====================================================
-- Step 7: Add comments for documentation
-- =====================================================

COMMENT ON COLUMN companies.parent_company_id IS 'Parent company ID for hierarchical structure';
COMMENT ON COLUMN companies.billing_mode IS 'Billing mode: SELF_PAID (pays for itself) or PARENT_PAID (parent pays)';
COMMENT ON COLUMN companies.position IS 'Position/role in parent company';
COMMENT ON COLUMN companies.department IS 'Department in parent company';

COMMENT ON COLUMN transactions.company_id IS 'Company that pays for the transaction';
COMMENT ON COLUMN transactions.initiator_company_id IS 'Company that initiated the request (may be different from payer)';

COMMENT ON COLUMN usage_events.company_id IS 'Company that pays for the usage';
COMMENT ON COLUMN usage_events.initiator_company_id IS 'Company that initiated the request (may be different from payer)';

-- =====================================================
-- Step 8: Verify constraints
-- =====================================================

-- Ensure company_id in transactions references companies
ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_company_id_fkey;

ALTER TABLE transactions
ADD CONSTRAINT transactions_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Ensure company_id in usage_events references companies
ALTER TABLE usage_events
DROP CONSTRAINT IF EXISTS usage_events_company_id_fkey;

ALTER TABLE usage_events
ADD CONSTRAINT usage_events_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

