-- Create company_provider_preferences table
CREATE TABLE IF NOT EXISTS "company_provider_preferences" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "preferred_provider" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "fallback_providers" TEXT[] NOT NULL DEFAULT '{}',
    "cost_limit" DECIMAL(10,6),
    "max_tokens" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_provider_preferences_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "company_provider_preferences_company_id_idx" ON "company_provider_preferences"("company_id");
CREATE INDEX "company_provider_preferences_model_idx" ON "company_provider_preferences"("model");
CREATE INDEX "company_provider_preferences_preferred_provider_idx" ON "company_provider_preferences"("preferred_provider");
CREATE INDEX "company_provider_preferences_is_active_idx" ON "company_provider_preferences"("is_active");

-- Create unique constraint
CREATE UNIQUE INDEX "company_provider_preferences_company_id_model_key" ON "company_provider_preferences"("company_id", "model");

-- Add foreign key constraint
ALTER TABLE "company_provider_preferences" ADD CONSTRAINT "company_provider_preferences_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
