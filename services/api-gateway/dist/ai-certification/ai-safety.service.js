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
exports.AISafetyService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
const shared_1 = require("@ai-aggregator/shared");
let AISafetyService = class AISafetyService {
    httpService;
    configService;
    safetyServiceUrl;
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        this.safetyServiceUrl = this.configService.get('SAFETY_SERVICE_URL', 'http://safety-service:3008');
    }
    async conductSafetyAssessment(request) {
        try {
            shared_1.LoggerUtil.info('api-gateway', 'Conducting safety assessment', {
                modelId: request.modelId,
                testType: request.testType,
                focusAreas: request.focusAreas
            });
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.safetyServiceUrl}/ai/safety/assess`, request));
            shared_1.LoggerUtil.info('api-gateway', 'Safety assessment completed', {
                modelId: request.modelId,
                success: response.data.success
            });
            return response.data;
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Safety assessment failed', error, {
                modelId: request.modelId,
                testType: request.testType
            });
            if (error.response?.status) {
                throw new common_1.HttpException(error.response.data?.message || 'Safety service error', error.response.status);
            }
            throw new common_1.HttpException('Failed to conduct safety assessment', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getSafetyLevels() {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.safetyServiceUrl}/ai/safety/levels`));
            return response.data;
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Get safety levels failed', error);
            throw new common_1.HttpException('Failed to get safety levels', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getRiskCategories() {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.safetyServiceUrl}/ai/safety/risk-categories`));
            return response.data;
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Get risk categories failed', error);
            throw new common_1.HttpException('Failed to get risk categories', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getModelAssessment(modelId) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.safetyServiceUrl}/ai/safety/models/${modelId}/assessment`));
            return response.data;
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Get model assessment failed', error, { modelId });
            throw new common_1.HttpException('Failed to get model assessment', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getModelIncidents(modelId, severity) {
        try {
            const params = {};
            if (severity)
                params.severity = severity;
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.safetyServiceUrl}/ai/safety/models/${modelId}/incidents`, { params }));
            return response.data;
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Get model incidents failed', error, { modelId, severity });
            throw new common_1.HttpException('Failed to get model incidents', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async reportIncident(incident) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.safetyServiceUrl}/ai/safety/incidents`, incident));
            return response.data;
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Report incident failed', error, { incident });
            throw new common_1.HttpException('Failed to report incident', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getSafetyStatistics(modelId) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.safetyServiceUrl}/ai/safety/models/${modelId}/statistics`));
            return response.data;
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Get safety statistics failed', error, { modelId });
            throw new common_1.HttpException('Failed to get safety statistics', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getSafetyLevelDescription(level) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.safetyServiceUrl}/ai/safety/levels/${level}/description`));
            return response.data;
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Get safety level description failed', error, { level });
            throw new common_1.HttpException('Failed to get safety level description', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.AISafetyService = AISafetyService;
exports.AISafetyService = AISafetyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], AISafetyService);
//# sourceMappingURL=ai-safety.service.js.map