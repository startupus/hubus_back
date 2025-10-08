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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AICertificationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const ai_certification_1 = require("../types/ai-certification");
const ai_certification_service_1 = require("../services/ai-certification.service");
let AICertificationController = class AICertificationController {
    certificationService;
    constructor(certificationService) {
        this.certificationService = certificationService;
    }
    async submitCertificationRequest(request) {
        return this.certificationService.submitCertificationRequest(request);
    }
    async getCertificationLevels() {
        return {
            levels: Object.values(ai_certification_1.AICertificationLevel)
        };
    }
    async getCertificationStatuses() {
        return {
            statuses: Object.values(ai_certification_1.AICertificationStatus)
        };
    }
    async getModelCertification(modelId) {
        return this.certificationService.getCertification(modelId);
    }
    async getAllCertifications(status, level) {
        const allCertifications = await this.certificationService.getAllCertifications();
        let filtered = allCertifications;
        if (status) {
            filtered = filtered.filter(cert => cert.status === status);
        }
        if (level) {
            filtered = filtered.filter(cert => cert.certificationLevel === level);
        }
        return { certifications: filtered };
    }
    async revokeCertification(modelId, body) {
        const success = await this.certificationService.revokeCertification(modelId, body.reason);
        return {
            success,
            message: success ? 'Certification revoked successfully' : 'Failed to revoke certification'
        };
    }
    async getLevelRequirements(level) {
        const requirements = this.getRequirementsForLevel(level);
        return {
            level,
            requirements
        };
    }
    getRequirementsForLevel(level) {
        const requirements = {
            [ai_certification_1.AICertificationLevel.BASIC]: {
                minScore: 70,
                minPassRate: 0.7,
                requiredTests: ['Performance Test', 'Basic Safety Test'],
                complianceStandards: []
            },
            [ai_certification_1.AICertificationLevel.STANDARD]: {
                minScore: 80,
                minPassRate: 0.8,
                requiredTests: ['Performance Test', 'Safety Test', 'Bias Test', 'GDPR Compliance'],
                complianceStandards: ['GDPR']
            },
            [ai_certification_1.AICertificationLevel.PREMIUM]: {
                minScore: 85,
                minPassRate: 0.85,
                requiredTests: ['Performance Test', 'Safety Test', 'Bias Test', 'Security Test', 'GDPR Compliance'],
                complianceStandards: ['GDPR', 'CCPA']
            },
            [ai_certification_1.AICertificationLevel.ENTERPRISE]: {
                minScore: 90,
                minPassRate: 0.9,
                requiredTests: ['Performance Test', 'Safety Test', 'Bias Test', 'Security Test', 'GDPR Compliance', 'HIPAA Compliance'],
                complianceStandards: ['GDPR', 'CCPA', 'HIPAA', 'SOX']
            },
            [ai_certification_1.AICertificationLevel.GOVERNMENT]: {
                minScore: 95,
                minPassRate: 0.95,
                requiredTests: ['Performance Test', 'Safety Test', 'Bias Test', 'Security Test', 'GDPR Compliance', 'HIPAA Compliance', 'ISO 27001 Compliance'],
                complianceStandards: ['GDPR', 'CCPA', 'HIPAA', 'SOX', 'ISO 27001', 'SOC 2']
            },
            [ai_certification_1.AICertificationLevel.UNVERIFIED]: {
                minScore: 0,
                minPassRate: 0,
                requiredTests: [],
                complianceStandards: []
            }
        };
        return requirements[level] || requirements[ai_certification_1.AICertificationLevel.BASIC];
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
    __metadata("design:paramtypes", [typeof (_b = typeof ai_certification_service_1.CertificationRequest !== "undefined" && ai_certification_service_1.CertificationRequest) === "function" ? _b : Object]),
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
    (0, common_1.Get)('models/:modelId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get model certification' }),
    (0, swagger_1.ApiParam)({ name: 'modelId', description: 'Model ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Certification retrieved successfully' }),
    __param(0, (0, common_1.Param)('modelId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AICertificationController.prototype, "getModelCertification", null);
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
exports.AICertificationController = AICertificationController = __decorate([
    (0, swagger_1.ApiTags)('AI Certification'),
    (0, common_1.Controller)('ai/certification'),
    __metadata("design:paramtypes", [typeof (_a = typeof ai_certification_service_1.AICertificationService !== "undefined" && ai_certification_service_1.AICertificationService) === "function" ? _a : Object])
], AICertificationController);
//# sourceMappingURL=ai-certification.controller.js.map