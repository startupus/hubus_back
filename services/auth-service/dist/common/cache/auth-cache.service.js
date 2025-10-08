"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AuthCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthCacheService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@ai-aggregator/shared");
let AuthCacheService = AuthCacheService_1 = class AuthCacheService {
    logger = new common_1.Logger(AuthCacheService_1.name);
    async cacheToken(token, userId, expiresIn) {
        shared_1.LoggerUtil.info('auth-service', 'Token caching temporarily disabled', { userId, expiresIn });
        return true;
    }
    async getTokenData(token) {
        shared_1.LoggerUtil.info('auth-service', 'Token data retrieval temporarily disabled', { token });
        return null;
    }
    async invalidateToken(token) {
        shared_1.LoggerUtil.info('auth-service', 'Token invalidation temporarily disabled', { token });
        return true;
    }
    async cacheApiKey(apiKey, userId, permissions, expiresIn) {
        shared_1.LoggerUtil.info('auth-service', 'API key caching temporarily disabled', { userId, permissions });
        return true;
    }
    async getApiKeyData(apiKey) {
        shared_1.LoggerUtil.info('auth-service', 'API key data retrieval temporarily disabled', { apiKey });
        return null;
    }
    async invalidateApiKey(apiKey) {
        shared_1.LoggerUtil.info('auth-service', 'API key invalidation temporarily disabled', { apiKey });
        return true;
    }
    async cacheUserSession(sessionId, userId, data, expiresIn) {
        shared_1.LoggerUtil.info('auth-service', 'User session caching temporarily disabled', { userId, sessionId });
        return true;
    }
    async getUserSession(sessionId) {
        shared_1.LoggerUtil.info('auth-service', 'User session retrieval temporarily disabled', { sessionId });
        return null;
    }
    async invalidateUserSession(sessionId) {
        shared_1.LoggerUtil.info('auth-service', 'User session invalidation temporarily disabled', { sessionId });
        return true;
    }
    async checkRateLimit(identifier, limit, windowSeconds) {
        shared_1.LoggerUtil.info('auth-service', 'Rate limiting temporarily disabled', { identifier, limit, windowSeconds });
        return {
            allowed: true,
            remaining: limit,
            resetTime: Date.now() + (windowSeconds * 1000)
        };
    }
    async clearUserCache(userId) {
        shared_1.LoggerUtil.info('auth-service', 'User cache clearing temporarily disabled', { userId });
        return true;
    }
    async getCacheStats() {
        shared_1.LoggerUtil.info('auth-service', 'Cache stats retrieval temporarily disabled');
        return {
            totalTokens: 0,
            totalApiKeys: 0,
            totalSessions: 0,
            totalRateLimits: 0
        };
    }
};
exports.AuthCacheService = AuthCacheService;
exports.AuthCacheService = AuthCacheService = AuthCacheService_1 = __decorate([
    (0, common_1.Injectable)()
], AuthCacheService);
//# sourceMappingURL=auth-cache.service.js.map