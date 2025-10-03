"use strict";
/**
 * Billing DTOs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingTierDto = exports.UsageStatsDto = exports.UpdateBillingLimitsDto = exports.BillingLimitsDto = exports.WithdrawalDto = exports.DepositDto = exports.BillingTransactionDto = exports.UserBalanceDto = exports.BillingRecordDto = void 0;
class BillingRecordDto {
    id;
    userId;
    provider;
    model;
    cost;
    tokens;
    requestId;
    timestamp;
    metadata;
}
exports.BillingRecordDto = BillingRecordDto;
class UserBalanceDto {
    userId;
    balance;
    currency;
    lastUpdated;
}
exports.UserBalanceDto = UserBalanceDto;
class BillingTransactionDto {
    id;
    userId;
    type;
    amount;
    currency;
    description;
    metadata;
    timestamp;
}
exports.BillingTransactionDto = BillingTransactionDto;
class DepositDto {
    amount;
    currency;
    description;
}
exports.DepositDto = DepositDto;
class WithdrawalDto {
    amount;
    currency;
    description;
}
exports.WithdrawalDto = WithdrawalDto;
class BillingLimitsDto {
    userId;
    dailyLimit;
    monthlyLimit;
    perRequestLimit;
    currency;
}
exports.BillingLimitsDto = BillingLimitsDto;
class UpdateBillingLimitsDto {
    dailyLimit;
    monthlyLimit;
    perRequestLimit;
}
exports.UpdateBillingLimitsDto = UpdateBillingLimitsDto;
class UsageStatsDto {
    userId;
    period;
    totalRequests;
    totalTokens;
    totalCost;
    providerBreakdown;
    startDate;
    endDate;
}
exports.UsageStatsDto = UsageStatsDto;
class PricingTierDto {
    name;
    description;
    monthlyPrice;
    currency;
    includedTokens;
    overageRate;
    features;
}
exports.PricingTierDto = PricingTierDto;
//# sourceMappingURL=billing.dto.js.map