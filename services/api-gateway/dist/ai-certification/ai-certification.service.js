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
exports.AICertificationService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
const shared_1 = require("@ai-aggregator/shared");
let AICertificationService = class AICertificationService {
    httpService;
    configService;
    certificationServiceUrl;
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        this.certificationServiceUrl = this.configService.get('CERTIFICATION_SERVICE_URL', 'http://ai-certification-service:3007');
    }
    async submitCertificationRequest(request) {
        try {
            shared_1.LoggerUtil.info('api-gateway', 'Submitting certification request', {
                modelId: request.modelId,
                provider: request.provider,
                requestedLevel: request.requestedLevel
            });
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.certificationServiceUrl}/certification/submit`, request));
            shared_1.LoggerUtil.info('api-gateway', 'Certification request submitted', {
                modelId: request.modelId,
                success: response.data.success
            });
            return response.data;
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Certification request failed', error, {
                modelId: request.modelId,
                provider: request.provider
            });
            if (error.response?.status) {
                throw new common_1.HttpException(error.response.data?.message || 'Certification service error', error.response.status);
            }
            throw new common_1.HttpException('Failed to submit certification request', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getCertificationLevels() {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.certificationServiceUrl}/certification/levels`));
            return response.data;
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Get certification levels failed', error);
            throw new common_1.HttpException('Failed to get certification levels', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getCertificationStatuses() {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.certificationServiceUrl}/certification/statuses`));
            return response.data;
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Get certification statuses failed', error);
            throw new common_1.HttpException('Failed to get certification statuses', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getModelCertification(modelId) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.certificationServiceUrl}/certification/model/${modelId}`));
            return response.data;
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Get model certification failed', error, { modelId });
            throw new common_1.HttpException('Failed to get model certification', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getAllCertifications(status, level) {
        try {
            const params = {};
            if (status)
                params.status = status;
            if (level)
                params.level = level;
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.certificationServiceUrl}/certification/all`, { params }));
            return response.data;
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Get all certifications failed', error, { status, level });
            throw new common_1.HttpException('Failed to get certifications', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async revokeCertification(modelId, reason) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.certificationServiceUrl}/certification/revoke/${modelId}`, { reason }));
            return response.data;
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Revoke certification failed', error, { modelId, reason });
            throw new common_1.HttpException('Failed to revoke certification', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getLevelRequirements(level) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.certificationServiceUrl}/certification/levels/${level}/requirements`));
            return response.data;
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Get level requirements failed', error, { level });
            throw new common_1.HttpException('Failed to get level requirements', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getRequirements() {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.certificationServiceUrl}/certification/requirements`));
            return response.data;
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Get requirements failed', error);
            throw new common_1.HttpException('Failed to get requirements', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.AICertificationService = AICertificationService;
exports.AICertificationService = AICertificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], AICertificationService);
//# sourceMappingURL=ai-certification.service.js.map