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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionUsageDto = exports.SubscribeToPlanDto = exports.UpdatePricingPlanDto = exports.CreatePricingPlanDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class CreatePricingPlanDto {
}
exports.CreatePricingPlanDto = CreatePricingPlanDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Plan name', example: 'Basic Plan' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePricingPlanDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Plan description', example: 'Basic plan with 10k input tokens' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePricingPlanDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Pricing type', enum: client_1.PricingType, example: client_1.PricingType.TOKEN_BASED }),
    (0, class_validator_1.IsEnum)(client_1.PricingType),
    __metadata("design:type", String)
], CreatePricingPlanDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Plan price', example: 29.99 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Transform)(({ value }) => value ? parseFloat(value) : undefined),
    __metadata("design:type", Number)
], CreatePricingPlanDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Currency', example: 'USD', default: 'USD' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePricingPlanDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Billing cycle', enum: client_1.BillingCycle, example: client_1.BillingCycle.MONTHLY }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.BillingCycle),
    __metadata("design:type", String)
], CreatePricingPlanDto.prototype, "billingCycle", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Is plan active', example: true, default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreatePricingPlanDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Included input tokens', example: 10000 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Transform)(({ value }) => value ? parseInt(value) : undefined),
    __metadata("design:type", Number)
], CreatePricingPlanDto.prototype, "inputTokens", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Included output tokens', example: 20000 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Transform)(({ value }) => value ? parseInt(value) : undefined),
    __metadata("design:type", Number)
], CreatePricingPlanDto.prototype, "outputTokens", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Input token price', example: 0.00003 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Transform)(({ value }) => value ? parseFloat(value) : undefined),
    __metadata("design:type", Number)
], CreatePricingPlanDto.prototype, "inputTokenPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Output token price', example: 0.00006 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Transform)(({ value }) => value ? parseFloat(value) : undefined),
    __metadata("design:type", Number)
], CreatePricingPlanDto.prototype, "outputTokenPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Discount percentage', example: 10.0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    (0, class_transformer_1.Transform)(({ value }) => value ? parseFloat(value) : undefined),
    __metadata("design:type", Number)
], CreatePricingPlanDto.prototype, "discountPercent", void 0);
class UpdatePricingPlanDto {
}
exports.UpdatePricingPlanDto = UpdatePricingPlanDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Plan name', example: 'Basic Plan' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePricingPlanDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Plan description', example: 'Basic plan with 10k input tokens' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePricingPlanDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Pricing type', enum: client_1.PricingType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.PricingType),
    __metadata("design:type", String)
], UpdatePricingPlanDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Plan price', example: 29.99 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Transform)(({ value }) => value ? parseFloat(value) : undefined),
    __metadata("design:type", Number)
], UpdatePricingPlanDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Currency', example: 'USD' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePricingPlanDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Billing cycle', enum: client_1.BillingCycle }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.BillingCycle),
    __metadata("design:type", String)
], UpdatePricingPlanDto.prototype, "billingCycle", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Is plan active', example: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdatePricingPlanDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Included input tokens', example: 10000 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Transform)(({ value }) => value ? parseInt(value) : undefined),
    __metadata("design:type", Number)
], UpdatePricingPlanDto.prototype, "inputTokens", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Included output tokens', example: 20000 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Transform)(({ value }) => value ? parseInt(value) : undefined),
    __metadata("design:type", Number)
], UpdatePricingPlanDto.prototype, "outputTokens", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Input token price', example: 0.00003 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Transform)(({ value }) => value ? parseFloat(value) : undefined),
    __metadata("design:type", Number)
], UpdatePricingPlanDto.prototype, "inputTokenPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Output token price', example: 0.00006 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Transform)(({ value }) => value ? parseFloat(value) : undefined),
    __metadata("design:type", Number)
], UpdatePricingPlanDto.prototype, "outputTokenPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Discount percentage', example: 10.0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    (0, class_transformer_1.Transform)(({ value }) => value ? parseFloat(value) : undefined),
    __metadata("design:type", Number)
], UpdatePricingPlanDto.prototype, "discountPercent", void 0);
class SubscribeToPlanDto {
}
exports.SubscribeToPlanDto = SubscribeToPlanDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Company ID', example: 'uuid' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubscribeToPlanDto.prototype, "companyId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Pricing plan ID', example: 'uuid' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubscribeToPlanDto.prototype, "planId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Payment method ID', example: 'uuid' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubscribeToPlanDto.prototype, "paymentMethodId", void 0);
class SubscriptionUsageDto {
}
exports.SubscriptionUsageDto = SubscriptionUsageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Input tokens used', example: 5000 }),
    __metadata("design:type", Number)
], SubscriptionUsageDto.prototype, "inputTokensUsed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Output tokens used', example: 10000 }),
    __metadata("design:type", Number)
], SubscriptionUsageDto.prototype, "outputTokensUsed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Input tokens limit', example: 10000 }),
    __metadata("design:type", Number)
], SubscriptionUsageDto.prototype, "inputTokensLimit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Output tokens limit', example: 20000 }),
    __metadata("design:type", Number)
], SubscriptionUsageDto.prototype, "outputTokensLimit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Input tokens remaining', example: 5000 }),
    __metadata("design:type", Number)
], SubscriptionUsageDto.prototype, "inputTokensRemaining", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Output tokens remaining', example: 10000 }),
    __metadata("design:type", Number)
], SubscriptionUsageDto.prototype, "outputTokensRemaining", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Usage percentage', example: 50.0 }),
    __metadata("design:type", Number)
], SubscriptionUsageDto.prototype, "usagePercentage", void 0);
//# sourceMappingURL=pricing.dto.js.map