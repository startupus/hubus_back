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
exports.PricingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const pricing_service_1 = require("./pricing.service");
const pricing_dto_1 = require("./dto/pricing.dto");
let PricingController = class PricingController {
    constructor(pricingService) {
        this.pricingService = pricingService;
    }
    async getPricingPlans(active) {
        return this.pricingService.getPricingPlans(active);
    }
    async getPricingPlan(id) {
        return this.pricingService.getPricingPlan(id);
    }
    async createPricingPlan(createPricingPlanDto) {
        return this.pricingService.createPricingPlan(createPricingPlanDto);
    }
    async updatePricingPlan(id, updatePricingPlanDto) {
        return this.pricingService.updatePricingPlan(id, updatePricingPlanDto);
    }
    async deletePricingPlan(id) {
        return this.pricingService.deletePricingPlan(id);
    }
    async subscribeToPlan(subscribeToPlanDto) {
        return this.pricingService.subscribeToPlan(subscribeToPlanDto);
    }
    async getCompanySubscriptions(companyId) {
        return this.pricingService.getCompanySubscriptions(companyId);
    }
    async getActiveSubscription(companyId) {
        return this.pricingService.getActiveSubscription(companyId);
    }
    async cancelSubscription(subscriptionId) {
        return this.pricingService.cancelSubscription(subscriptionId);
    }
    async getSubscriptionUsage(subscriptionId) {
        return this.pricingService.getSubscriptionUsage(subscriptionId);
    }
};
exports.PricingController = PricingController;
__decorate([
    (0, common_1.Get)('plans'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all pricing plans' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Pricing plans retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'active', required: false, description: 'Filter by active status' }),
    __param(0, (0, common_1.Query)('active')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Boolean]),
    __metadata("design:returntype", Promise)
], PricingController.prototype, "getPricingPlans", null);
__decorate([
    (0, common_1.Get)('plans/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get pricing plan by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Pricing plan ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Pricing plan retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Pricing plan not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PricingController.prototype, "getPricingPlan", null);
__decorate([
    (0, common_1.Post)('plans'),
    (0, swagger_1.ApiOperation)({ summary: 'Create new pricing plan' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Pricing plan created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid request data' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pricing_dto_1.CreatePricingPlanDto]),
    __metadata("design:returntype", Promise)
], PricingController.prototype, "createPricingPlan", null);
__decorate([
    (0, common_1.Put)('plans/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update pricing plan' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Pricing plan ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Pricing plan updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Pricing plan not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pricing_dto_1.UpdatePricingPlanDto]),
    __metadata("design:returntype", Promise)
], PricingController.prototype, "updatePricingPlan", null);
__decorate([
    (0, common_1.Delete)('plans/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete pricing plan' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Pricing plan ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Pricing plan deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Pricing plan not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PricingController.prototype, "deletePricingPlan", null);
__decorate([
    (0, common_1.Post)('subscribe'),
    (0, swagger_1.ApiOperation)({ summary: 'Subscribe company to pricing plan' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Subscription created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid request data' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pricing_dto_1.SubscribeToPlanDto]),
    __metadata("design:returntype", Promise)
], PricingController.prototype, "subscribeToPlan", null);
__decorate([
    (0, common_1.Get)('subscriptions/:companyId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get company subscriptions' }),
    (0, swagger_1.ApiParam)({ name: 'companyId', description: 'Company ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Subscriptions retrieved successfully' }),
    __param(0, (0, common_1.Param)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PricingController.prototype, "getCompanySubscriptions", null);
__decorate([
    (0, common_1.Get)('subscriptions/:companyId/active'),
    (0, swagger_1.ApiOperation)({ summary: 'Get active company subscription' }),
    (0, swagger_1.ApiParam)({ name: 'companyId', description: 'Company ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Active subscription retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'No active subscription found' }),
    __param(0, (0, common_1.Param)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PricingController.prototype, "getActiveSubscription", null);
__decorate([
    (0, common_1.Post)('subscriptions/:subscriptionId/cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel subscription' }),
    (0, swagger_1.ApiParam)({ name: 'subscriptionId', description: 'Subscription ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Subscription cancelled successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Subscription not found' }),
    __param(0, (0, common_1.Param)('subscriptionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PricingController.prototype, "cancelSubscription", null);
__decorate([
    (0, common_1.Get)('subscriptions/:subscriptionId/usage'),
    (0, swagger_1.ApiOperation)({ summary: 'Get subscription token usage' }),
    (0, swagger_1.ApiParam)({ name: 'subscriptionId', description: 'Subscription ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Usage retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Subscription not found' }),
    __param(0, (0, common_1.Param)('subscriptionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PricingController.prototype, "getSubscriptionUsage", null);
exports.PricingController = PricingController = __decorate([
    (0, swagger_1.ApiTags)('pricing'),
    (0, common_1.Controller)('pricing'),
    __metadata("design:paramtypes", [pricing_service_1.PricingService])
], PricingController);
//# sourceMappingURL=pricing.controller.js.map