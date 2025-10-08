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
exports.AISafetyController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const ai_certification_1 = require("../types/ai-certification");
const ai_safety_service_1 = require("../services/ai-safety.service");
let AISafetyController = class AISafetyController {
    safetyService;
    constructor(safetyService) {
        this.safetyService = safetyService;
    }
    async conductSafetyAssessment(request) {
        return this.safetyService.conductSafetyAssessment(request);
    }
    async getSafetyLevels() {
        return {
            levels: Object.values(ai_certification_1.AISafetyLevel)
        };
    }
    async getRiskCategories() {
        return {
            categories: Object.values(ai_certification_1.RiskFactorCategory)
        };
    }
    async getModelAssessment(modelId) {
        // В реальной реализации здесь был бы запрос к базе данных
        return null;
    }
    async getModelIncidents(modelId, severity) {
        // В реальной реализации здесь был бы запрос к базе данных
        return { incidents: [] };
    }
    async reportIncident(incident) {
        return this.safetyService.reportSafetyIncident(incident);
    }
    async getSafetyStatistics(modelId) {
        return this.safetyService.getSafetyStatistics(modelId);
    }
    async getSafetyLevelDescription(level) {
        const levelInfo = this.getSafetyLevelInfo(level);
        return {
            level,
            description: levelInfo.description,
            requirements: levelInfo.requirements,
            restrictions: levelInfo.restrictions
        };
    }
    getSafetyLevelInfo(level) {
        const levelInfo = {
            [ai_certification_1.AISafetyLevel.SAFE]: {
                description: 'Model is safe for general use with minimal restrictions',
                requirements: [
                    'Passes all safety tests',
                    'Low bias scores',
                    'No harmful content generation',
                    'Regular monitoring'
                ],
                restrictions: []
            },
            [ai_certification_1.AISafetyLevel.CAUTION]: {
                description: 'Model requires caution and monitoring during use',
                requirements: [
                    'Passes most safety tests',
                    'Acceptable bias levels',
                    'Content filtering recommended',
                    'Regular monitoring required'
                ],
                restrictions: [
                    'Human oversight recommended',
                    'Content review for sensitive applications'
                ]
            },
            [ai_certification_1.AISafetyLevel.HIGH_RISK]: {
                description: 'Model poses significant risks and requires strict controls',
                requirements: [
                    'Enhanced safety measures',
                    'Comprehensive bias mitigation',
                    'Advanced content filtering',
                    '24/7 monitoring'
                ],
                restrictions: [
                    'Expert oversight required',
                    'Highly restricted use cases',
                    'Frequent safety assessments',
                    'Incident response procedures'
                ]
            },
        };
        return levelInfo[level] || levelInfo[ai_certification_1.AISafetyLevel.SAFE];
    }
};
exports.AISafetyController = AISafetyController;
__decorate([
    (0, common_1.Post)('assess'),
    (0, swagger_1.ApiOperation)({ summary: 'Conduct safety assessment' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Safety assessment completed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid request' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AISafetyController.prototype, "conductSafetyAssessment", null);
__decorate([
    (0, common_1.Get)('levels'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available safety levels' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Safety levels retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AISafetyController.prototype, "getSafetyLevels", null);
__decorate([
    (0, common_1.Get)('risk-categories'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available risk categories' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Risk categories retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AISafetyController.prototype, "getRiskCategories", null);
__decorate([
    (0, common_1.Get)('models/:modelId/assessment'),
    (0, swagger_1.ApiOperation)({ summary: 'Get model safety assessment' }),
    (0, swagger_1.ApiParam)({ name: 'modelId', description: 'Model ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Assessment retrieved successfully' }),
    __param(0, (0, common_1.Param)('modelId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AISafetyController.prototype, "getModelAssessment", null);
__decorate([
    (0, common_1.Get)('models/:modelId/incidents'),
    (0, swagger_1.ApiOperation)({ summary: 'Get model safety incidents' }),
    (0, swagger_1.ApiParam)({ name: 'modelId', description: 'Model ID' }),
    (0, swagger_1.ApiQuery)({ name: 'severity', required: false, description: 'Filter by severity' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Incidents retrieved successfully' }),
    __param(0, (0, common_1.Param)('modelId')),
    __param(1, (0, common_1.Query)('severity')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AISafetyController.prototype, "getModelIncidents", null);
__decorate([
    (0, common_1.Post)('incidents'),
    (0, swagger_1.ApiOperation)({ summary: 'Report safety incident' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Incident reported successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AISafetyController.prototype, "reportIncident", null);
__decorate([
    (0, common_1.Get)('models/:modelId/statistics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get model safety statistics' }),
    (0, swagger_1.ApiParam)({ name: 'modelId', description: 'Model ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Statistics retrieved successfully' }),
    __param(0, (0, common_1.Param)('modelId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AISafetyController.prototype, "getSafetyStatistics", null);
__decorate([
    (0, common_1.Get)('levels/:level/description'),
    (0, swagger_1.ApiOperation)({ summary: 'Get safety level description' }),
    (0, swagger_1.ApiParam)({ name: 'level', description: 'Safety level' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Description retrieved successfully' }),
    __param(0, (0, common_1.Param)('level')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AISafetyController.prototype, "getSafetyLevelDescription", null);
exports.AISafetyController = AISafetyController = __decorate([
    (0, swagger_1.ApiTags)('AI Safety'),
    (0, common_1.Controller)('ai/safety'),
    __metadata("design:paramtypes", [ai_safety_service_1.AISafetyService])
], AISafetyController);
//# sourceMappingURL=ai-safety.controller.js.map