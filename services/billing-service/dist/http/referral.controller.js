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
exports.ReferralController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const referral_service_1 = require("../billing/referral.service");
const rate_limit_guard_1 = require("../common/guards/rate-limit.guard");
let ReferralController = class ReferralController {
    constructor(referralService) {
        this.referralService = referralService;
    }
    async getReferralEarnings(companyId, startDate, endDate, limit) {
        return this.referralService.getReferralEarnings(companyId, startDate, endDate, limit);
    }
    async getReferralEarningsSummary(companyId, startDate, endDate) {
        return this.referralService.getReferralEarningsSummary(companyId, startDate, endDate);
    }
    async getReferredCompanies(companyId, limit) {
        return this.referralService.getReferredCompanies(companyId, limit);
    }
};
exports.ReferralController = ReferralController;
__decorate([
    (0, common_1.Get)('earnings/:companyId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get referral earnings for a company' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Referral earnings retrieved successfully' }),
    __param(0, (0, common_1.Param)('companyId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReferralController.prototype, "getReferralEarnings", null);
__decorate([
    (0, common_1.Get)('earnings/summary/:companyId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get referral earnings summary for a company' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Referral earnings summary retrieved successfully' }),
    __param(0, (0, common_1.Param)('companyId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReferralController.prototype, "getReferralEarningsSummary", null);
__decorate([
    (0, common_1.Get)('referrals/:companyId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get referred companies for a company' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Referred companies retrieved successfully' }),
    __param(0, (0, common_1.Param)('companyId')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReferralController.prototype, "getReferredCompanies", null);
exports.ReferralController = ReferralController = __decorate([
    (0, swagger_1.ApiTags)('Referral'),
    (0, common_1.Controller)('billing/referral'),
    (0, common_1.UseGuards)(rate_limit_guard_1.RateLimitGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [referral_service_1.ReferralService])
], ReferralController);
//# sourceMappingURL=referral.controller.js.map