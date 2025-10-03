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
exports.ApiKeyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const shared_1 = require("@ai-aggregator/shared");
let ApiKeyService = class ApiKeyService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createApiKey(userId, createApiKeyDto) {
        try {
            const key = shared_1.CryptoUtil.generateApiKey();
            const apiKey = await this.prisma.apiKey.create({
                data: {
                    key,
                    userId,
                    name: createApiKeyDto.name,
                    description: createApiKeyDto.description,
                    permissions: createApiKeyDto.permissions || [],
                    expiresAt: createApiKeyDto.expiresAt ? new Date(createApiKeyDto.expiresAt) : null,
                },
            });
            await this.logSecurityEvent(userId, 'API_KEY_CREATED', 'MEDIUM', `API key created: ${createApiKeyDto.name}`);
            shared_1.LoggerUtil.info('auth-service', 'API key created', {
                apiKeyId: apiKey.id,
                userId,
                name: createApiKeyDto.name
            });
            return this.mapApiKeyToDto(apiKey);
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to create API key', error, { userId });
            throw error;
        }
    }
    async getApiKeyById(apiKeyId, userId) {
        try {
            const apiKey = await this.prisma.apiKey.findFirst({
                where: {
                    id: apiKeyId,
                    userId,
                },
            });
            if (!apiKey) {
                throw new common_1.NotFoundException('API key not found');
            }
            return this.mapApiKeyToDto(apiKey);
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to get API key', error, { apiKeyId, userId });
            throw error;
        }
    }
    async getApiKeyByKey(key) {
        try {
            const apiKey = await this.prisma.apiKey.findUnique({
                where: { key },
                include: { user: true },
            });
            if (!apiKey) {
                throw new common_1.NotFoundException('API key not found');
            }
            return this.mapApiKeyToDto(apiKey);
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to get API key by key', error, { key });
            throw error;
        }
    }
    async listApiKeys(userId, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            const [apiKeys, total] = await Promise.all([
                this.prisma.apiKey.findMany({
                    where: { userId },
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                }),
                this.prisma.apiKey.count({
                    where: { userId },
                }),
            ]);
            return {
                apiKeys: apiKeys.map(apiKey => this.mapApiKeyToDto(apiKey)),
                total,
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to list API keys', error, { userId });
            throw error;
        }
    }
    async updateApiKey(apiKeyId, userId, updateApiKeyDto) {
        try {
            const existingApiKey = await this.prisma.apiKey.findFirst({
                where: {
                    id: apiKeyId,
                    userId,
                },
            });
            if (!existingApiKey) {
                throw new common_1.NotFoundException('API key not found');
            }
            const apiKey = await this.prisma.apiKey.update({
                where: { id: apiKeyId },
                data: {
                    name: updateApiKeyDto.name,
                    description: updateApiKeyDto.description,
                    permissions: updateApiKeyDto.permissions,
                    isActive: updateApiKeyDto.isActive,
                },
            });
            await this.logSecurityEvent(userId, 'API_KEY_UPDATED', 'LOW', `API key updated: ${apiKey.name}`);
            shared_1.LoggerUtil.info('auth-service', 'API key updated', {
                apiKeyId,
                userId,
                name: apiKey.name
            });
            return this.mapApiKeyToDto(apiKey);
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to update API key', error, { apiKeyId, userId });
            throw error;
        }
    }
    async revokeApiKey(apiKeyId, userId) {
        try {
            const existingApiKey = await this.prisma.apiKey.findFirst({
                where: {
                    id: apiKeyId,
                    userId,
                },
            });
            if (!existingApiKey) {
                throw new common_1.NotFoundException('API key not found');
            }
            await this.prisma.apiKey.update({
                where: { id: apiKeyId },
                data: { isActive: false },
            });
            await this.logSecurityEvent(userId, 'API_KEY_REVOKED', 'MEDIUM', `API key revoked: ${existingApiKey.name}`);
            shared_1.LoggerUtil.info('auth-service', 'API key revoked', {
                apiKeyId,
                userId,
                name: existingApiKey.name
            });
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to revoke API key', error, { apiKeyId, userId });
            throw error;
        }
    }
    async validateApiKey(key) {
        try {
            const apiKey = await this.prisma.apiKey.findUnique({
                where: { key },
                include: { user: true },
            });
            if (!apiKey || !apiKey.isActive || !apiKey.user.isActive) {
                return { isValid: false };
            }
            if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
                return { isValid: false };
            }
            await this.prisma.apiKey.update({
                where: { id: apiKey.id },
                data: { lastUsedAt: new Date() },
            });
            return {
                isValid: true,
                userId: apiKey.userId,
                permissions: apiKey.permissions,
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to validate API key', error, { key });
            return { isValid: false };
        }
    }
    mapApiKeyToDto(apiKey) {
        return {
            id: apiKey.id,
            key: apiKey.key,
            userId: apiKey.userId,
            name: apiKey.name,
            description: apiKey.description,
            isActive: apiKey.isActive,
            permissions: apiKey.permissions,
            lastUsedAt: apiKey.lastUsedAt,
            expiresAt: apiKey.expiresAt,
            createdAt: apiKey.createdAt,
            metadata: apiKey.metadata,
        };
    }
    async logSecurityEvent(userId, type, severity, description) {
        try {
            await this.prisma.securityEvent.create({
                data: {
                    userId,
                    type: type,
                    severity: severity,
                    description,
                },
            });
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to log security event', error);
        }
    }
};
exports.ApiKeyService = ApiKeyService;
exports.ApiKeyService = ApiKeyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ApiKeyService);
//# sourceMappingURL=api-key.service.js.map