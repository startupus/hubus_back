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
exports.AICertificationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const shared_1 = require("@ai-aggregator/shared");
const ai_certification_service_1 = require("./ai-certification.service");
let AICertificationController = class AICertificationController {
    certificationService;
    constructor(certificationService) {
        this.certificationService = certificationService;
    }
    async submitCertificationRequest(request) {
        return this.certificationService.submitCertificationRequest(request);
    }
    async getCertificationLevels() {
        return this.certificationService.getCertificationLevels();
    }
    async getCertificationStatuses() {
        return this.certificationService.getCertificationStatuses();
    }
    async getModelCertificationById(modelId) {
        return this.certificationService.getModelCertification(modelId);
    }
    async getAllCertifications(status, level) {
        return this.certificationService.getAllCertifications(status, level);
    }
    async revokeCertification(modelId, body) {
        return this.certificationService.revokeCertification(modelId, body.reason);
    }
    async getLevelRequirements(level) {
        return this.certificationService.getLevelRequirements(level);
    }
    async getRequirements() {
        return this.certificationService.getRequirements();
    }
};
exports.AICertificationController = AICertificationController;
__decorate([
    (0, common_1.Post)('submit'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit certification request' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Certification request submitted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid request' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AICertificationController.prototype, "submitCertificationRequest", null);
__decorate([
    (0, common_1.Get)('levels'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available certification levels' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Certification levels retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AICertificationController.prototype, "getCertificationLevels", null);
__decorate([
    (0, common_1.Get)('statuses'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available certification statuses' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Certification statuses retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AICertificationController.prototype, "getCertificationStatuses", null);
__decorate([
    (0, common_1.Get)('model/:modelId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get model certification by model ID' }),
    (0, swagger_1.ApiParam)({ name: 'modelId', description: 'Model ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Model certification retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Model certification not found' }),
    __param(0, (0, common_1.Param)('modelId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AICertificationController.prototype, "getModelCertificationById", null);
__decorate([
    (0, common_1.Get)('all'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all certifications' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, description: 'Filter by status' }),
    (0, swagger_1.ApiQuery)({ name: 'level', required: false, description: 'Filter by level' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Certifications retrieved successfully' }),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('level')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AICertificationController.prototype, "getAllCertifications", null);
__decorate([
    (0, common_1.Post)('revoke/:modelId'),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke model certification' }),
    (0, swagger_1.ApiParam)({ name: 'modelId', description: 'Model ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Certification revoked successfully' }),
    __param(0, (0, common_1.Param)('modelId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AICertificationController.prototype, "revokeCertification", null);
__decorate([
    (0, common_1.Get)('levels/:level/requirements'),
    (0, swagger_1.ApiOperation)({ summary: 'Get certification level requirements' }),
    (0, swagger_1.ApiParam)({ name: 'level', description: 'Certification level' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Requirements retrieved successfully' }),
    __param(0, (0, common_1.Param)('level')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AICertificationController.prototype, "getLevelRequirements", null);
__decorate([
    (0, common_1.Get)('requirements'),
    (0, swagger_1.ApiOperation)({ summary: 'Get general certification requirements' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Requirements retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AICertificationController.prototype, "getRequirements", null);
exports.AICertificationController = AICertificationController = __decorate([
    (0, swagger_1.ApiTags)('AI Certification'),
    (0, common_1.Controller)('ai/certification'),
    __metadata("design:paramtypes", [ai_certification_service_1.AICertificationService])
], AICertificationController);
//# sourceMappingURL=ai-certification.controller.js.map