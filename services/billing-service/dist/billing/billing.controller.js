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
exports.BillingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const shared_1 = require("@ai-aggregator/shared");
let BillingController = class BillingController {
    constructor() { }
    async getBalance(userId) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'HTTP GetBalance called', { userId });
            return {
                success: true,
                message: 'Balance retrieved successfully',
                balance: {
                    user_id: userId,
                    balance: 100.0,
                    currency: 'USD',
                    updated_at: new Date().toISOString(),
                },
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
    async updateBalance(userId, body) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'HTTP UpdateBalance called', {
                userId,
                amount: body.amount,
                operation: body.operation
            });
            return {
                success: true,
                message: 'Balance updated successfully',
                balance: {
                    user_id: userId,
                    balance: 100.0 + (body.operation === 'add' ? body.amount : -body.amount),
                    currency: 'USD',
                    updated_at: new Date().toISOString(),
                },
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
    async createTransaction(body) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'HTTP CreateTransaction called', {
                user_id: body.user_id,
                type: body.type,
                amount: body.amount
            });
            return {
                success: true,
                message: 'Transaction created successfully',
                transaction: {
                    id: `txn_${Date.now()}`,
                    user_id: body.user_id,
                    type: body.type,
                    amount: body.amount,
                    description: body.description || 'Transaction',
                    provider: body.provider || 'system',
                    status: 'completed',
                    created_at: new Date().toISOString(),
                    metadata: {},
                },
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
                userId,
                page,
                limit
            });
            return {
                success: true,
                message: 'Transaction history retrieved successfully',
                transactions: [],
                pagination: {
                    page: page || 1,
                    limit: limit || 10,
                    total: 0,
                    total_pages: 0,
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
    async calculateCost(body) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'HTTP CalculateCost called', {
                user_id: body.user_id,
                provider: body.provider,
                model: body.model
            });
            const inputCost = (body.input_tokens || 0) * 0.001;
            const outputCost = (body.output_tokens || 0) * 0.002;
            return {
                success: true,
                message: 'Cost calculated successfully',
                cost: {
                    provider: body.provider,
                    model: body.model,
                    input_tokens: body.input_tokens || 0,
                    output_tokens: body.output_tokens || 0,
                    input_cost: inputCost,
                    output_cost: outputCost,
                    total_cost: inputCost + outputCost,
                    currency: 'USD',
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
    async processPayment(body) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'HTTP ProcessPayment called', {
                user_id: body.user_id,
                amount: body.amount,
                payment_method: body.payment_method
            });
            return {
                success: true,
                message: 'Payment processed successfully',
                transaction: {
                    id: `payment_${Date.now()}`,
                    user_id: body.user_id,
                    type: 'credit',
                    amount: body.amount,
                    description: body.description || 'Payment',
                    provider: 'payment_gateway',
                    status: 'completed',
                    created_at: new Date().toISOString(),
                    metadata: {
                        payment_method: body.payment_method,
                    },
                },
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
};
exports.BillingController = BillingController;
__decorate([
    (0, common_1.Get)('balance/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user balance' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Balance retrieved successfully' }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Post)('balance/:userId/update'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user balance' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Balance updated successfully' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "updateBalance", null);
__decorate([
    (0, common_1.Post)('transactions'),
    (0, swagger_1.ApiOperation)({ summary: 'Create billing transaction' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Transaction created successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "createTransaction", null);
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
], BillingController.prototype, "getTransactionHistory", null);
__decorate([
    (0, common_1.Post)('calculate-cost'),
    (0, swagger_1.ApiOperation)({ summary: 'Calculate cost for usage' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cost calculated successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "calculateCost", null);
__decorate([
    (0, common_1.Post)('payment'),
    (0, swagger_1.ApiOperation)({ summary: 'Process payment' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Payment processed successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "processPayment", null);
exports.BillingController = BillingController = __decorate([
    (0, swagger_1.ApiTags)('Billing'),
    (0, common_1.Controller)('billing'),
    __metadata("design:paramtypes", [])
], BillingController);
//# sourceMappingURL=billing.controller.js.map