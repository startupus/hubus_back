-- Migration: Add Company Hierarchy to Auth Service
-- Description: Adds hierarchical structure to companies, removes User model

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
-- Step 2: Update API Keys table
-- =====================================================

-- Rename columns in api_keys
ALTER TABLE api_keys 
RENAME COLUMN owner_id TO company_id;

ALTER TABLE api_keys 
DROP COLUMN IF EXISTS owner_type;

-- Update foreign key constraint
ALTER TABLE api_keys 
DROP CONSTRAINT IF EXISTS api_key_user,
DROP CONSTRAINT IF EXISTS api_key_company;

ALTER TABLE api_keys
ADD CONSTRAINT api_key_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- =====================================================
-- Step 3: Update RefreshTokens table
-- =====================================================

ALTER TABLE refresh_tokens
RENAME COLUMN user_id TO company_id;

ALTER TABLE refresh_tokens
DROP CONSTRAINT IF EXISTS refresh_tokens_user_id_fkey;

ALTER TABLE refresh_tokens
ADD CONSTRAINT refresh_tokens_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Update index
DROP INDEX IF EXISTS refresh_tokens_user_id_idx;
CREATE INDEX refresh_tokens_company_id_idx ON refresh_tokens(company_id);

-- =====================================================
-- Step 4: Update LoginAttempts table
-- =====================================================

ALTER TABLE login_attempts
DROP COLUMN IF EXISTS owner_type;

-- =====================================================
-- Step 5: Update PasswordResetTokens table
-- =====================================================

ALTER TABLE password_reset_tokens
RENAME COLUMN owner_id TO company_id;

ALTER TABLE password_reset_tokens
DROP COLUMN IF EXISTS owner_type;

ALTER TABLE password_reset_tokens
DROP CONSTRAINT IF EXISTS password_reset_user,
DROP CONSTRAINT IF EXISTS password_reset_company;

ALTER TABLE password_reset_tokens
ADD CONSTRAINT password_reset_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- =====================================================
-- Step 6: Update EmailVerificationTokens table
-- =====================================================

ALTER TABLE email_verification_tokens
RENAME COLUMN owner_id TO company_id;

ALTER TABLE email_verification_tokens
DROP COLUMN IF EXISTS owner_type;

ALTER TABLE email_verification_tokens
DROP CONSTRAINT IF EXISTS email_verification_user,
DROP CONSTRAINT IF EXISTS email_verification_company;

ALTER TABLE email_verification_tokens
ADD CONSTRAINT email_verification_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- =====================================================
-- Step 7: Update SecurityEvents table
-- =====================================================

ALTER TABLE security_events
RENAME COLUMN owner_id TO company_id;

ALTER TABLE security_events
DROP COLUMN IF EXISTS owner_type;

ALTER TABLE security_events
DROP CONSTRAINT IF EXISTS security_event_user,
DROP CONSTRAINT IF EXISTS security_event_company;

ALTER TABLE security_events
ADD CONSTRAINT security_event_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

-- =====================================================
-- Step 8: Drop User table (if exists)
-- =====================================================

DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- Step 9: Update enums
-- =====================================================

-- Drop OwnerType enum if exists
DROP TYPE IF EXISTS "OwnerType" CASCADE;

-- Update UserRole enum to remove 'user'
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
        -- Create new enum without 'user'
        CREATE TYPE "UserRole_new" AS ENUM ('admin', 'company', 'service', 'fsb');
        
        -- Update all references
        ALTER TABLE companies ALTER COLUMN role TYPE "UserRole_new" USING role::text::"UserRole_new";
        
        -- Drop old enum and rename new one
        DROP TYPE "UserRole";
        ALTER TYPE "UserRole_new" RENAME TO "UserRole";
    END IF;
END $$;

COMMENT ON COLUMN companies.parent_company_id IS 'Parent company ID for hierarchical structure';
COMMENT ON COLUMN companies.billing_mode IS 'Billing mode: SELF_PAID or PARENT_PAID';
COMMENT ON COLUMN companies.position IS 'Position in parent company';
COMMENT ON COLUMN companies.department IS 'Department in parent company';

