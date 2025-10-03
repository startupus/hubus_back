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
exports.ApiKeyController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const passport_1 = require("@nestjs/passport");
const api_key_service_1 = require("./api-key.service");
const shared_1 = require("@ai-aggregator/shared");
let ApiKeyController = class ApiKeyController {
    apiKeyService;
    constructor(apiKeyService) {
        this.apiKeyService = apiKeyService;
    }
    async createApiKey(createApiKeyDto, req) {
        const userId = req.user.sub;
        return this.apiKeyService.createApiKey(userId, createApiKeyDto);
    }
    async listApiKeys(page = 1, limit = 10, req) {
        const userId = req.user.sub;
        return this.apiKeyService.listApiKeys(userId, page, limit);
    }
    async getApiKeyById(id, req) {
        const userId = req.user.sub;
        return this.apiKeyService.getApiKeyById(id, userId);
    }
    async updateApiKey(id, updateApiKeyDto, req) {
        const userId = req.user.sub;
        return this.apiKeyService.updateApiKey(id, userId, updateApiKeyDto);
    }
    async revokeApiKey(id, req) {
        const userId = req.user.sub;
        return this.apiKeyService.revokeApiKey(id, userId);
    }
};
exports.ApiKeyController = ApiKeyController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new API key' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'API key created successfully', type: shared_1.ApiKeyResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shared_1.CreateApiKeyDto, Object]),
    __metadata("design:returntype", Promise)
], ApiKeyController.prototype, "createApiKey", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List user API keys' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'API keys retrieved successfully' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", Promise)
], ApiKeyController.prototype, "listApiKeys", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get API key by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'API key retrieved successfully', type: shared_1.ApiKeyResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'API key not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ApiKeyController.prototype, "getApiKeyById", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update API key' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'API key updated successfully', type: shared_1.ApiKeyResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'API key not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, shared_1.UpdateApiKeyDto, Object]),
    __metadata("design:returntype", Promise)
], ApiKeyController.prototype, "updateApiKey", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke API key' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'API key revoked successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'API key not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ApiKeyController.prototype, "revokeApiKey", null);
exports.ApiKeyController = ApiKeyController = __decorate([
    (0, swagger_1.ApiTags)('API Keys'),
    (0, common_1.Controller)('api-keys'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [api_key_service_1.ApiKeyService])
], ApiKeyController);
//# sourceMappingURL=api-key.controller.js.map