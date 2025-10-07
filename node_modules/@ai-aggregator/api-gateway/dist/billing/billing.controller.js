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
const billing_service_1 = require("./billing.service");
const shared_1 = require("@ai-aggregator/shared");
let BillingController = class BillingController {
    billingService;
    constructor(billingService) {
        this.billingService = billingService;
    }
    async getBalance(userId) {
        return this.billingService.getBalance(userId);
    }
    async trackUsage(data) {
        return this.billingService.trackUsage(data);
    }
    async getReport(userId) {
        return this.billingService.getReport(userId);
    }
    async createTransaction(data) {
        return this.billingService.createTransaction(data);
    }
    async getTransactions(userId) {
        return this.billingService.getTransactions(userId);
    }
    async processPayment(data) {
        return this.billingService.processPayment(data);
    }
    async refundPayment(data) {
        return this.billingService.refundPayment(data);
    }
};
exports.BillingController = BillingController;
__decorate([
    (0, common_1.Get)('balance/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user balance' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User balance retrieved successfully', type: shared_1.UserBalanceDto }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Post)('usage/track'),
    (0, swagger_1.ApiOperation)({ summary: 'Track usage for billing' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                userId: { type: 'string' },
                service: { type: 'string' },
                resource: { type: 'string' },
                quantity: { type: 'number' }
            },
            required: ['userId', 'service', 'resource', 'quantity']
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Usage tracked successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "trackUsage", null);
__decorate([
    (0, common_1.Get)('report/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get billing report for user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Billing report retrieved successfully' }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "getReport", null);
__decorate([
    (0, common_1.Post)('transaction'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new transaction' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Transaction created successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "createTransaction", null);
__decorate([
    (0, common_1.Get)('transactions/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user transactions' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User transactions retrieved successfully' }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "getTransactions", null);
__decorate([
    (0, common_1.Post)('payment/process'),
    (0, swagger_1.ApiOperation)({ summary: 'Process payment' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Payment processed successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "processPayment", null);
__decorate([
    (0, common_1.Post)('payment/refund'),
    (0, swagger_1.ApiOperation)({ summary: 'Refund payment' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Payment refunded successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "refundPayment", null);
exports.BillingController = BillingController = __decorate([
    (0, swagger_1.ApiTags)('Billing'),
    (0, common_1.Controller)('billing'),
    __metadata("design:paramtypes", [billing_service_1.BillingService])
], BillingController);
//# sourceMappingURL=billing.controller.js.map