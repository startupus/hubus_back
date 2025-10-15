"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const shared_1 = require("@ai-aggregator/shared");
const billing_service_1 = require("../billing/billing.service");
const pricing_service_1 = require("../billing/pricing.service");
const payment_gateway_service_1 = require("../billing/payment-gateway.service");
const rate_limit_guard_1 = require("../common/guards/rate-limit.guard");
const billing_dto_1 = require("../dto/billing.dto");
const billing_types_1 = require("../types/billing.types");
let HttpController = class HttpController {
    constructor(billingService, pricingService, paymentGatewayService) {
        this.billingService = billingService;
        this.pricingService = pricingService;
        this.paymentGatewayService = paymentGatewayService;
    }
    async getBalance(params) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'HTTP GetBalance called', { company_id: params.companyId });
            shared_1.LoggerUtil.debug('billing-service', 'About to call billingService.getBalance', { company_id: params.companyId });
            const result = await this.billingService.getBalance({ companyId: params.companyId });
            shared_1.LoggerUtil.debug('billing-service', 'billingService.getBalance returned', { company_id: params.companyId, success: result.success });
            if (!result.success) {
                return {
                    success: false,
                    message: result.error || 'Failed to get balance',
                    balance: null,
                };
            }
            return {
                success: true,
                message: 'Balance retrieved successfully',
                balance: result.balance.balance,
                currency: result.balance.currency,
                creditLimit: result.balance.creditLimit,
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'HTTP GetBalance failed', error, { company_id: params.companyId });
            shared_1.LoggerUtil.debug('billing-service', 'Error details', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
                balance: null,
            };
        }
    }
    async updateBalance(data) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'HTTP UpdateBalance called', {
                company_id: data.companyId,
                amount: data.amount,
                operation: data.operation
            });
            const result = await this.billingService.updateBalance(data);
            if (!result.success) {
                return {
                    success: false,
                    message: result.error || 'Failed to update balance',
                    balance: null,
                };
            }
            return {
                success: true,
                message: 'Balance updated successfully',
                balance: result.balance,
                transaction: result.transaction,
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'HTTP UpdateBalance failed', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
                balance: null,
            };
        }
    }
    async createTransaction(data) {
        try {
            const request = {
                companyId: data.user_id || data.companyId,
                type: data.type === 'credit' ? billing_types_1.TransactionType.CREDIT :
                    data.type === 'debit' ? billing_types_1.TransactionType.DEBIT :
                        data.type === 'refund' ? billing_types_1.TransactionType.REFUND :
                            data.type === 'chargeback' ? billing_types_1.TransactionType.CHARGEBACK :
                                data.type,
                amount: data.amount,
                currency: data.currency,
                description: data.description,
                reference: data.reference,
                metadata: data.metadata,
                paymentMethodId: data.paymentMethodId
            };
            shared_1.LoggerUtil.debug('billing-service', 'HTTP CreateTransaction called', {
                company_id: request.companyId,
                type: request.type,
                amount: request.amount
            });
            const result = await this.billingService.createTransaction(request);
            if (!result.success) {
                return {
                    success: false,
                    message: result.error || 'Failed to create transaction',
                    transaction: null,
                };
            }
            return {
                success: true,
                message: 'Transaction created successfully',
                transaction: result.transaction,
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'HTTP CreateTransaction failed', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
                transaction: null,
            };
        }
    }
    async getTransactionHistory(companyId, page = 1, limit = 10) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'HTTP GetTransactionHistory called', {
                company_id: companyId,
                page: page,
                limit: limit
            });
            return {
                success: true,
                message: 'Transaction history retrieved successfully',
                transactions: [],
                pagination: {
                    page: page,
                    limit: limit,
                    total: 0,
                    totalPages: 0,
                },
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'HTTP GetTransactionHistory failed', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
                transactions: [],
                pagination: null,
            };
        }
    }
    async calculateCost(data) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'HTTP CalculateCost called', {
                company_id: data.companyId,
                service: data.service,
                resource: data.resource,
                quantity: data.quantity
            });
            const result = await this.billingService.calculateCost(data);
            if (!result.success) {
                return {
                    success: false,
                    message: result.error || 'Failed to calculate cost',
                    cost: null,
                };
            }
            return {
                success: true,
                message: 'Cost calculated successfully',
                cost: {
                    service: data.service,
                    resource: data.resource,
                    quantity: data.quantity,
                    totalCost: result.cost,
                    currency: result.currency,
                    breakdown: result.breakdown,
                },
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'HTTP CalculateCost failed', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
                cost: null,
            };
        }
    }
    async processPayment(data) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'HTTP ProcessPayment called', {
                company_id: data.companyId,
                amount: data.amount,
                payment_method_id: data.paymentMethodId
            });
            const result = await this.billingService.processPayment(data);
            if (!result.success) {
                return {
                    success: false,
                    message: result.error || 'Failed to process payment',
                    transaction: null,
                };
            }
            return {
                success: true,
                message: 'Payment processed successfully',
                transaction: result.transaction,
                paymentUrl: result.paymentUrl,
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'HTTP ProcessPayment failed', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
                transaction: null,
            };
        }
    }
    async trackUsage(data) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'HTTP TrackUsage called', {
                company_id: data.companyId,
                service: data.service,
                resource: data.resource,
                quantity: data.quantity
            });
            const result = await this.billingService.trackUsage(data);
            if (!result.success) {
                return {
                    success: false,
                    message: result.error || 'Failed to track usage',
                    usageEvent: null,
                };
            }
            return {
                success: true,
                message: 'Usage tracked successfully',
                usageEvent: result.usageEvent,
                cost: result.cost,
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'HTTP TrackUsage failed', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
                usageEvent: null,
            };
        }
    }
    async getBillingReport(companyId, startDate, endDate) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'HTTP GetBillingReport called', {
                company_id: companyId,
                start_date: startDate,
                end_date: endDate
            });
            const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const end = endDate ? new Date(endDate) : new Date();
            const report = await this.billingService.getBillingReport(companyId, start, end);
            return {
                success: true,
                message: 'Billing report generated successfully',
                report,
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'HTTP GetBillingReport failed', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
                report: null,
            };
        }
    }
    async getCompanyBalance(companyId) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'HTTP GetCompanyBalance called', { company_id: companyId });
            const result = await this.billingService.getBalance({ companyId: companyId });
            if (!result.success) {
                return {
                    success: false,
                    message: result.error || 'Failed to get company balance',
                    balance: null,
                };
            }
            return {
                success: true,
                message: 'Company balance retrieved successfully',
                balance: result.balance.balance,
                currency: result.balance.currency,
                creditLimit: result.balance.creditLimit,
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'HTTP GetCompanyBalance failed', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
                balance: null,
            };
        }
    }
    async getCompanyTransactions(companyId, limit, offset) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'HTTP GetCompanyTransactions called', {
                company_id: companyId,
                limit,
                offset
            });
            const result = await this.billingService.getTransactions(companyId, limit || 50, offset || 0);
            return {
                success: true,
                message: 'Company transactions retrieved successfully',
                transactions: result,
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'HTTP GetCompanyTransactions failed', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
                transactions: [],
            };
        }
    }
    async getCompanyUsersStatistics(companyId, startDate, endDate) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'HTTP GetCompanyUsersStatistics called', {
                company_id: companyId,
                start_date: startDate,
                end_date: endDate
            });
            const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const end = endDate ? new Date(endDate) : new Date();
            const statistics = await this.billingService.getCompanyUsersStatistics(companyId, start, end);
            return {
                success: true,
                message: 'Company users statistics retrieved successfully',
                statistics,
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'HTTP GetCompanyUsersStatistics failed', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
                statistics: null,
            };
        }
    }
    async getCompanyBillingReport(companyId, startDate, endDate) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'HTTP GetCompanyBillingReport called', {
                company_id: companyId,
                start_date: startDate,
                end_date: endDate
            });
            const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const end = endDate ? new Date(endDate) : new Date();
            const report = await this.billingService.getBillingReport(companyId, start, end);
            return {
                success: true,
                message: 'Company billing report generated successfully',
                report,
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'HTTP GetCompanyBillingReport failed', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
                report: null,
            };
        }
    }
    async topUpBalance(data) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'HTTP TopUpBalance called', {
                companyId: data.companyId,
                amount: data.amount
            });
            const result = await this.billingService.topUpBalance({
                companyId: data.companyId,
                amount: data.amount,
                currency: data.currency || 'USD'
            });
            if (!result.success) {
                return {
                    success: false,
                    message: result.error || 'Failed to top up balance',
                    balance: null,
                };
            }
            return {
                success: true,
                message: 'Balance topped up successfully',
                balance: {
                    balance: result.balance,
                    currency: data.currency || 'USD'
                }
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'HTTP TopUpBalance failed', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
                balance: null,
            };
        }
    }
};
exports.HttpController = HttpController;
__decorate([
    (0, common_1.Get)('balance/:companyId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get company balance' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Balance retrieved successfully' }),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [billing_dto_1.GetBalanceDto]),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Post)('balance/update'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user balance' }),
    (0, swagger_1.ApiBody)({ type: billing_dto_1.UpdateBalanceDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Balance updated successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [billing_dto_1.UpdateBalanceDto]),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "updateBalance", null);
__decorate([
    (0, common_1.Post)('transactions'),
    (0, swagger_1.ApiOperation)({ summary: 'Create transaction' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                companyId: { type: 'string' },
                type: { type: 'string', enum: ['CREDIT', 'DEBIT', 'REFUND', 'CHARGEBACK'] },
                amount: { type: 'number' },
                currency: { type: 'string' },
                description: { type: 'string' },
                reference: { type: 'string' },
                metadata: { type: 'object' },
                paymentMethodId: { type: 'string' }
            },
            required: ['companyId', 'type', 'amount']
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Transaction created successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "createTransaction", null);
__decorate([
    (0, common_1.Get)('transactions/:companyId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get company transaction history' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Transaction history retrieved successfully' }),
    __param(0, (0, common_1.Param)('companyId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "getTransactionHistory", null);
__decorate([
    (0, common_1.Post)('calculate-cost'),
    (0, swagger_1.ApiOperation)({ summary: 'Calculate request cost' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                companyId: { type: 'string' },
                service: { type: 'string' },
                resource: { type: 'string' },
                quantity: { type: 'number' },
                metadata: { type: 'object' }
            },
            required: ['companyId', 'service', 'resource', 'quantity']
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cost calculated successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "calculateCost", null);
__decorate([
    (0, common_1.Post)('payment'),
    (0, swagger_1.ApiOperation)({ summary: 'Process payment' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                companyId: { type: 'string' },
                amount: { type: 'number' },
                currency: { type: 'string' },
                paymentMethodId: { type: 'string' },
                description: { type: 'string' },
                metadata: { type: 'object' }
            },
            required: ['companyId', 'amount']
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Payment processed successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "processPayment", null);
__decorate([
    (0, common_1.Post)('usage/track'),
    (0, swagger_1.ApiOperation)({ summary: 'Track usage' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                companyId: { type: 'string' },
                service: { type: 'string' },
                resource: { type: 'string' },
                quantity: { type: 'number' },
                unit: { type: 'string' },
                metadata: { type: 'object' }
            },
            required: ['companyId', 'service', 'resource']
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Usage tracked successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [billing_dto_1.TrackUsageDto]),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "trackUsage", null);
__decorate([
    (0, common_1.Get)('report/:companyId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get company billing report' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Billing report generated successfully' }),
    __param(0, (0, common_1.Param)('companyId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "getBillingReport", null);
__decorate([
    (0, common_1.Get)('company/:companyId/balance'),
    (0, swagger_1.ApiOperation)({ summary: 'Get company balance' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Company balance retrieved successfully' }),
    __param(0, (0, common_1.Param)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "getCompanyBalance", null);
__decorate([
    (0, common_1.Get)('company/:companyId/transactions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get company transactions' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Company transactions retrieved successfully' }),
    __param(0, (0, common_1.Param)('companyId')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "getCompanyTransactions", null);
__decorate([
    (0, common_1.Get)('company/:companyId/users/statistics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get company users statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Company users statistics retrieved successfully' }),
    __param(0, (0, common_1.Param)('companyId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "getCompanyUsersStatistics", null);
__decorate([
    (0, common_1.Get)('company/:companyId/report'),
    (0, swagger_1.ApiOperation)({ summary: 'Get company billing report' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Company billing report generated successfully' }),
    __param(0, (0, common_1.Param)('companyId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "getCompanyBillingReport", null);
__decorate([
    (0, common_1.Post)('top-up'),
    (0, swagger_1.ApiOperation)({ summary: 'Top up company balance' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Balance topped up successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "topUpBalance", null);
exports.HttpController = HttpController = __decorate([
    (0, swagger_1.ApiTags)('billing'),
    (0, common_1.Controller)('billing'),
    (0, common_1.UseGuards)(rate_limit_guard_1.RateLimitGuard),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true, whitelist: true })),
    __metadata("design:paramtypes", [billing_service_1.BillingService,
        pricing_service_1.PricingService,
        payment_gateway_service_1.PaymentGatewayService])
], HttpController);
//# sourceMappingURL=http.controller.js.map