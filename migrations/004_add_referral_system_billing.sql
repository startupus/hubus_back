-- Migration: Add referral system to billing-service
-- Description: Add referral fields and ReferralTransaction model to billing-service database

-- Add referral fields to companies table
ALTER TABLE companies 
ADD COLUMN referral_code VARCHAR(255) UNIQUE,
ADD COLUMN referred_by VARCHAR(255),
ADD COLUMN referral_code_id VARCHAR(255);

-- Create indexes for referral fields
CREATE INDEX idx_companies_referral_code ON companies(referral_code);
CREATE INDEX idx_companies_referred_by ON companies(referred_by);

-- Create referral_transactions table
CREATE TABLE referral_transactions (
    id VARCHAR(255) PRIMARY KEY,
    referral_owner_id VARCHAR(255) NOT NULL,
    referral_earner_id VARCHAR(255) NOT NULL,
    original_transaction_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10,4) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    input_token_rate DECIMAL(10,6) NOT NULL,
    output_token_rate DECIMAL(10,6) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    description TEXT,
    metadata JSONB,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for referral_transactions table
CREATE INDEX idx_referral_transactions_owner ON referral_transactions(referral_owner_id);
CREATE INDEX idx_referral_transactions_earner ON referral_transactions(referral_earner_id);
CREATE INDEX idx_referral_transactions_original ON referral_transactions(original_transaction_id);
CREATE INDEX idx_referral_transactions_status ON referral_transactions(status);
CREATE INDEX idx_referral_transactions_created_at ON referral_transactions(created_at);

-- Add foreign key constraints
ALTER TABLE referral_transactions 
ADD CONSTRAINT fk_referral_transactions_owner 
FOREIGN KEY (referral_owner_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE referral_transactions 
ADD CONSTRAINT fk_referral_transactions_earner 
FOREIGN KEY (referral_earner_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Add foreign key constraints for referral relationships
ALTER TABLE companies 
ADD CONSTRAINT fk_companies_referred_by 
FOREIGN KEY (referred_by) REFERENCES companies(id) ON DELETE SET NULL;
