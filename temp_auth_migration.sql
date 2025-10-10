-- Add referral fields to companies table
ALTER TABLE companies 
ADD COLUMN referral_code VARCHAR(255) UNIQUE,
ADD COLUMN referred_by VARCHAR(255),
ADD COLUMN referral_code_id VARCHAR(255);

-- Create indexes for referral fields
CREATE INDEX idx_companies_referral_code ON companies(referral_code);
CREATE INDEX idx_companies_referred_by ON companies(referred_by);

-- Create referral_codes table
CREATE TABLE referral_codes (
    id VARCHAR(255) PRIMARY KEY,
    code VARCHAR(255) UNIQUE NOT NULL,
    company_id VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for referral_codes table
CREATE INDEX idx_referral_codes_company_id ON referral_codes(company_id);
CREATE INDEX idx_referral_codes_code ON referral_codes(code);
CREATE INDEX idx_referral_codes_is_active ON referral_codes(is_active);
CREATE INDEX idx_referral_codes_expires_at ON referral_codes(expires_at);

-- Add foreign key constraints
ALTER TABLE referral_codes 
ADD CONSTRAINT fk_referral_codes_company 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Add foreign key constraints for referral relationships
ALTER TABLE companies 
ADD CONSTRAINT fk_companies_referred_by 
FOREIGN KEY (referred_by) REFERENCES companies(id) ON DELETE SET NULL;

ALTER TABLE companies 
ADD CONSTRAINT fk_companies_referral_code_id 
FOREIGN KEY (referral_code_id) REFERENCES referral_codes(id) ON DELETE SET NULL;
