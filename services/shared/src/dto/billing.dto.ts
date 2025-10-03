/**
 * Billing DTOs
 */

export class BillingRecordDto {
  id: string;
  userId: string;
  provider: string;
  model: string;
  cost: number;
  tokens: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  requestId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export class UserBalanceDto {
  userId: string;
  balance: number;
  currency: string;
  lastUpdated: string;
}

export class BillingTransactionDto {
  id: string;
  userId: string;
  type: 'charge' | 'refund' | 'deposit' | 'withdrawal';
  amount: number;
  currency: string;
  description: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export class DepositDto {
  amount: number;
  currency: string;
  description?: string;
}

export class WithdrawalDto {
  amount: number;
  currency: string;
  description?: string;
}

export class BillingLimitsDto {
  userId: string;
  dailyLimit: number;
  monthlyLimit: number;
  perRequestLimit: number;
  currency: string;
}

export class UpdateBillingLimitsDto {
  dailyLimit?: number;
  monthlyLimit?: number;
  perRequestLimit?: number;
}

export class UsageStatsDto {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  providerBreakdown: Record<string, {
    requests: number;
    tokens: number;
    cost: number;
  }>;
  startDate: string;
  endDate: string;
}

export class PricingTierDto {
  name: string;
  description: string;
  monthlyPrice: number;
  currency: string;
  includedTokens: number;
  overageRate: number;
  features: string[];
}