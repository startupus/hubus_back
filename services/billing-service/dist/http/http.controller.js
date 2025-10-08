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
let HttpController = class HttpController {
    constructor(billingService, pricingService, paymentGatewayService) {
        this.billingService = billingService;
        this.pricingService = pricingService;
        this.paymentGatewayService = paymentGatewayService;
    }
    async getBalance(params) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'HTTP GetBalance called', { user_id: params.userId });
            const result = await this.billingService.getBalance({ userId: params.userId });
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
                balance: result.balance,
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'HTTP GetBalance failed', error);
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
                user_id: data.userId,
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
            shared_1.LoggerUtil.debug('billing-service', 'HTTP CreateTransaction called', {
                user_id: data.userId,
                type: data.type,
                amount: data.amount
            });
            const result = await this.billingService.createTransaction(data);
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
    async getTransactionHistory(userId, page = 1, limit = 10) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'HTTP GetTransactionHistory called', {
                user_id: userId,
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
                user_id: data.userId,
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
                user_id: data.userId,
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
                user_id: data.userId,
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
    async getBillingReport(userId, startDate, endDate) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'HTTP GetBillingReport called', {
                user_id: userId,
                start_date: startDate,
                end_date: endDate
            });
            const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const end = endDate ? new Date(endDate) : new Date();
            const report = await this.billingService.getBillingReport(userId, start, end);
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
};
exports.HttpController = HttpController;
__decorate([
    (0, common_1.Get)('balance/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user balance' }),
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
                userId: { type: 'string' },
                type: { type: 'string', enum: ['CREDIT', 'DEBIT', 'REFUND', 'CHARGEBACK'] },
                amount: { type: 'number' },
                currency: { type: 'string' },
                description: { type: 'string' },
                reference: { type: 'string' },
                metadata: { type: 'object' },
                paymentMethodId: { type: 'string' }
            },
            required: ['userId', 'type', 'amount']
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Transaction created successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "createTransaction", null);
__decorate([
    (0, common_1.Get)('transactions/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get transaction history' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Transaction history retrieved successfully' }),
    __param(0, (0, common_1.Param)('userId')),
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
                userId: { type: 'string' },
                service: { type: 'string' },
                resource: { type: 'string' },
                quantity: { type: 'number' },
                metadata: { type: 'object' }
            },
            required: ['userId', 'service', 'resource', 'quantity']
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
                userId: { type: 'string' },
                amount: { type: 'number' },
                currency: { type: 'string' },
                paymentMethodId: { type: 'string' },
                description: { type: 'string' },
                metadata: { type: 'object' }
            },
            required: ['userId', 'amount']
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
                userId: { type: 'string' },
                service: { type: 'string' },
                resource: { type: 'string' },
                quantity: { type: 'number' },
                unit: { type: 'string' },
                metadata: { type: 'object' }
            },
            required: ['userId', 'service', 'resource']
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Usage tracked successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [billing_dto_1.TrackUsageDto]),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "trackUsage", null);
__decorate([
    (0, common_1.Get)('report/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get billing report' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Billing report generated successfully' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "getBillingReport", null);
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