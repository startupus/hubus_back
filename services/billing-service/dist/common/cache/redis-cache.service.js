"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RedisCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCacheService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const shared_1 = require("@ai-aggregator/shared");
const Redis = __importStar(require("redis"));
let RedisCacheService = RedisCacheService_1 = class RedisCacheService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(RedisCacheService_1.name);
        this.keyPrefix = this.configService.get('redis.keyPrefix', 'ai_aggregator:billing:');
        this.defaultTTL = this.configService.get('redis.ttl', 300);
        this.redisClient = Redis.createClient({
            url: this.configService.get('redis.url', 'redis://localhost:6379'),
            password: this.configService.get('redis.password'),
            database: this.configService.get('redis.db', 1),
            socket: {
                connectTimeout: 10000,
            },
        });
        this.redisClient.on('error', (err) => {
            shared_1.LoggerUtil.error('billing-service', 'Redis connection error', err);
        });
        this.redisClient.on('connect', () => {
            shared_1.LoggerUtil.info('billing-service', 'Redis connected successfully');
        });
        this.redisClient.on('ready', () => {
            shared_1.LoggerUtil.info('billing-service', 'Redis ready for operations');
        });
        this.redisClient.connect();
    }
    async get(key) {
        try {
            const fullKey = `${this.keyPrefix}${key}`;
            const data = await this.redisClient.get(fullKey);
            if (!data) {
                shared_1.LoggerUtil.debug('billing-service', 'Cache miss', { key });
                return null;
            }
            shared_1.LoggerUtil.debug('billing-service', 'Cache hit', { key });
            return JSON.parse(data);
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Cache get error', error, { key });
            return null;
        }
    }
    async set(key, value, ttl) {
        try {
            const fullKey = `${this.keyPrefix}${key}`;
            const data = JSON.stringify(value);
            const actualTTL = ttl || this.defaultTTL;
            const result = await this.redisClient.setEx(fullKey, actualTTL, data);
            if (result === 'OK') {
                shared_1.LoggerUtil.debug('billing-service', 'Cache set', { key, ttl: actualTTL });
                return true;
            }
            return false;
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Cache set error', error, { key });
            return false;
        }
    }
    async delete(key) {
        try {
            const fullKey = `${this.keyPrefix}${key}`;
            const result = await this.redisClient.del(fullKey);
            shared_1.LoggerUtil.debug('billing-service', 'Cache delete', { key, deleted: result > 0 });
            return result > 0;
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Cache delete error', error, { key });
            return false;
        }
    }
    async deleteMany(keys) {
        try {
            const fullKeys = keys.map(key => `${this.keyPrefix}${key}`);
            const result = await this.redisClient.del(fullKeys);
            shared_1.LoggerUtil.debug('billing-service', 'Cache delete many', {
                keys: keys.length,
                deleted: result
            });
            return result;
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Cache delete many error', error);
            return 0;
        }
    }
    async clear() {
        try {
            const pattern = `${this.keyPrefix}*`;
            const keys = await this.redisClient.keys(pattern);
            if (keys.length === 0) {
                shared_1.LoggerUtil.info('billing-service', 'Cache already empty');
                return true;
            }
            const result = await this.redisClient.del(keys);
            shared_1.LoggerUtil.info('billing-service', 'Cache cleared', { deletedCount: result });
            return result > 0;
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Cache clear error', error);
            return false;
        }
    }
    async size() {
        try {
            const pattern = `${this.keyPrefix}*`;
            const keys = await this.redisClient.keys(pattern);
            return keys.length;
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Cache size error', error);
            return 0;
        }
    }
    async getStats() {
        try {
            const [pattern, info] = await Promise.all([
                this.redisClient.keys(`${this.keyPrefix}*`),
                this.redisClient.info('memory')
            ]);
            return {
                size: pattern.length,
                memoryUsage: `${Math.round(parseInt(info) / 1024 / 1024 * 100) / 100} MB`,
                keys: pattern.map(key => key.replace(this.keyPrefix, ''))
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Cache stats error', error);
            return {
                size: 0,
                memoryUsage: '0 MB',
                keys: []
            };
        }
    }
    async cacheCompanyBalance(companyId, balance) {
        const key = `balance:${companyId}`;
        return await this.set(key, balance, 2 * 60);
    }
    async getCachedCompanyBalance(companyId) {
        const key = `balance:${companyId}`;
        return await this.get(key);
    }
    async invalidateCompanyBalance(companyId) {
        const key = `balance:${companyId}`;
        return await this.delete(key);
    }
    async cachePricingRules(service, resource, rules) {
        const key = `pricing:${service}:${resource}`;
        return await this.set(key, rules, 10 * 60);
    }
    async getCachedPricingRules(service, resource) {
        const key = `pricing:${service}:${resource}`;
        return await this.get(key);
    }
    async cacheCurrencyRate(from, to, rate) {
        const key = `currency:${from}:${to}`;
        return await this.set(key, rate, 60 * 60);
    }
    async getCachedCurrencyRate(from, to) {
        const key = `currency:${from}:${to}`;
        return await this.get(key);
    }
    async cacheCompanyTransactions(companyId, transactions, page = 1) {
        const key = `transactions:${companyId}:${page}`;
        return await this.set(key, transactions, 5 * 60);
    }
    async getCachedCompanyTransactions(companyId, page = 1) {
        const key = `transactions:${companyId}:${page}`;
        return await this.get(key);
    }
    async invalidateCompanyTransactions(companyId) {
        const pattern = `transactions:${companyId}:*`;
        const keys = await this.redisClient.keys(`${this.keyPrefix}${pattern}`);
        if (keys.length === 0) {
            return true;
        }
        const result = await this.redisClient.del(keys);
        return result > 0;
    }
    async isConnected() {
        try {
            await this.redisClient.ping();
            return true;
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Redis connection check failed', error);
            return false;
        }
    }
    async disconnect() {
        try {
            await this.redisClient.quit();
            shared_1.LoggerUtil.info('billing-service', 'Redis connection closed');
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to close Redis connection', error);
        }
    }
};
exports.RedisCacheService = RedisCacheService;
exports.RedisCacheService = RedisCacheService = RedisCacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisCacheService);
//# sourceMappingURL=redis-cache.service.js.map