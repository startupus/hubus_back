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
exports.OrchestratorController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const shared_1 = require("@ai-aggregator/shared");
const orchestrator_service_1 = require("./orchestrator.service");
let OrchestratorController = class OrchestratorController {
    orchestratorService;
    constructor(orchestratorService) {
        this.orchestratorService = orchestratorService;
    }
    async routeRequest(body) {
        try {
            shared_1.LoggerUtil.debug('provider-orchestrator', 'HTTP RouteRequest called', {
                userId: body.userId,
                model: body.model,
                urgency: body.urgency,
                quality: body.quality
            });
            const analysis = {
                userId: body.userId,
                model: body.model,
                prompt: body.prompt,
                expectedTokens: body.expectedTokens || 100,
                budget: body.budget,
                urgency: body.urgency || 'medium',
                quality: body.quality || 'standard',
                options: body.options
            };
            const result = await this.orchestratorService.routeRequest(analysis);
            shared_1.LoggerUtil.info('provider-orchestrator', 'Request routed successfully', {
                userId: body.userId,
                provider: result.provider,
                cost: result.cost,
                responseTime: result.responseTime,
                fallbackUsed: result.fallbackUsed
            });
            return result;
        }
        catch (error) {
            shared_1.LoggerUtil.error('provider-orchestrator', 'HTTP RouteRequest failed', error, {
                userId: body.userId,
                model: body.model
            });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                fallbackUsed: false
            };
        }
    }
    async getProviderStatus(providerId) {
        try {
            shared_1.LoggerUtil.debug('provider-orchestrator', 'HTTP GetProviderStatus called', {
                providerId
            });
            const status = await this.orchestratorService.getProviderStatus(providerId);
            shared_1.LoggerUtil.info('provider-orchestrator', 'Provider status retrieved', {
                providerId,
                status: status.status,
                responseTime: status.responseTime,
                successRate: status.successRate
            });
            return status;
        }
        catch (error) {
            shared_1.LoggerUtil.error('provider-orchestrator', 'HTTP GetProviderStatus failed', error, { providerId });
            throw error;
        }
    }
    async getProviders() {
        try {
            shared_1.LoggerUtil.debug('provider-orchestrator', 'HTTP GetProviders called');
            const providers = await this.orchestratorService.getProviders();
            shared_1.LoggerUtil.info('provider-orchestrator', 'Providers list retrieved', {
                count: providers.length,
                providers: providers.map(p => ({ id: p.id, name: p.name, status: p.isActive ? 'active' : 'inactive' }))
            });
            return {
                providers: providers.map(provider => ({
                    id: provider.id,
                    name: provider.name,
                    models: provider.models,
                    costPerToken: provider.costPerToken,
                    maxTokens: provider.maxTokens,
                    responseTime: provider.responseTime,
                    successRate: provider.successRate,
                    isActive: provider.isActive,
                    priority: provider.priority
                }))
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('provider-orchestrator', 'HTTP GetProviders failed', error);
            throw error;
        }
    }
};
exports.OrchestratorController = OrchestratorController;
__decorate([
    (0, common_1.Post)('route-request'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Route AI request to appropriate provider' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                userId: { type: 'string' },
                model: { type: 'string' },
                prompt: { type: 'string' },
                expectedTokens: { type: 'number', default: 100 },
                budget: { type: 'number', description: 'Maximum cost in USD' },
                urgency: { type: 'string', enum: ['low', 'medium', 'high'], default: 'medium' },
                quality: { type: 'string', enum: ['standard', 'premium'], default: 'standard' },
                options: { type: 'object', description: 'Additional request options' }
            },
            required: ['userId', 'model', 'prompt']
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Request routed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - validation failed' }),
    (0, swagger_1.ApiResponse)({ status: 503, description: 'No providers available' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrchestratorController.prototype, "routeRequest", null);
__decorate([
    (0, common_1.Get)('provider-status/:providerId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get provider status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Provider status retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Provider not found' }),
    __param(0, (0, common_1.Param)('providerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrchestratorController.prototype, "getProviderStatus", null);
__decorate([
    (0, common_1.Get)('providers'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all available providers' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Providers list retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OrchestratorController.prototype, "getProviders", null);
exports.OrchestratorController = OrchestratorController = __decorate([
    (0, swagger_1.ApiTags)('Provider Orchestrator'),
    (0, common_1.Controller)('orchestrator'),
    __metadata("design:paramtypes", [orchestrator_service_1.OrchestratorService])
], OrchestratorController);
//# sourceMappingURL=orchestrator.controller.js.map