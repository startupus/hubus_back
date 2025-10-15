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
exports.SubscriptionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const subscription_service_1 = require("../billing/subscription.service");
const rate_limit_guard_1 = require("../common/guards/rate-limit.guard");
let SubscriptionController = class SubscriptionController {
    constructor(subscriptionService) {
        this.subscriptionService = subscriptionService;
    }
    async getSubscriptionPlans() {
        return this.subscriptionService.getSubscriptionPlans();
    }
    async getMySubscription(companyId) {
        return this.subscriptionService.getMySubscription(companyId);
    }
    async getSubscriptionUsage(companyId) {
        return this.subscriptionService.getSubscriptionUsage(companyId);
    }
    async subscribeToPlan(data) {
        return this.subscriptionService.subscribeToPlan(data.companyId, data.planId);
    }
    async cancelSubscription(data) {
        return this.subscriptionService.cancelSubscription(data.companyId);
    }
};
exports.SubscriptionController = SubscriptionController;
__decorate([
    (0, common_1.Get)('plans'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all available subscription plans' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Subscription plans retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "getSubscriptionPlans", null);
__decorate([
    (0, common_1.Get)('my/:companyId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current company subscription' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Current subscription retrieved successfully' }),
    __param(0, (0, common_1.Param)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "getMySubscription", null);
__decorate([
    (0, common_1.Get)('usage/:companyId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get subscription usage statistics for a company' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Subscription usage statistics retrieved successfully' }),
    __param(0, (0, common_1.Param)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "getSubscriptionUsage", null);
__decorate([
    (0, common_1.Post)('subscribe'),
    (0, swagger_1.ApiOperation)({ summary: 'Subscribe to a plan' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Subscription created successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "subscribeToPlan", null);
__decorate([
    (0, common_1.Put)('cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel current subscription' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Subscription cancelled successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "cancelSubscription", null);
exports.SubscriptionController = SubscriptionController = __decorate([
    (0, swagger_1.ApiTags)('Subscription'),
    (0, common_1.Controller)('billing/subscription'),
    (0, common_1.UseGuards)(rate_limit_guard_1.RateLimitGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [subscription_service_1.SubscriptionService])
], SubscriptionController);
//# sourceMappingURL=subscription.controller.js.map