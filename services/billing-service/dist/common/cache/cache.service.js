"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@ai-aggregator/shared");
let CacheService = CacheService_1 = class CacheService {
    constructor() {
        this.logger = new common_1.Logger(CacheService_1.name);
        this.cache = new Map();
        this.defaultTTL = 5 * 60 * 1000;
    }
    get(key) {
        try {
            const item = this.cache.get(key);
            if (!item) {
                return null;
            }
            if (Date.now() > item.expires) {
                this.cache.delete(key);
                shared_1.LoggerUtil.debug('billing-service', 'Cache expired', { key });
                return null;
            }
            shared_1.LoggerUtil.debug('billing-service', 'Cache hit', { key });
            return item.value;
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Cache get error', error, { key });
            return null;
        }
    }
    set(key, value, ttl) {
        try {
            const expires = Date.now() + (ttl || this.defaultTTL);
            this.cache.set(key, { value, expires });
            shared_1.LoggerUtil.debug('billing-service', 'Cache set', { key, ttl: ttl || this.defaultTTL });
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Cache set error', error, { key });
        }
    }
    delete(key) {
        try {
            const deleted = this.cache.delete(key);
            shared_1.LoggerUtil.debug('billing-service', 'Cache delete', { key, deleted });
            return deleted;
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Cache delete error', error, { key });
            return false;
        }
    }
    clear() {
        try {
            this.cache.clear();
            shared_1.LoggerUtil.info('billing-service', 'Cache cleared');
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Cache clear error', error);
        }
    }
    size() {
        return this.cache.size;
    }
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
    cleanup() {
        try {
            const now = Date.now();
            let cleaned = 0;
            for (const [key, item] of this.cache.entries()) {
                if (now > item.expires) {
                    this.cache.delete(key);
                    cleaned++;
                }
            }
            if (cleaned > 0) {
                shared_1.LoggerUtil.info('billing-service', 'Cache cleanup completed', { cleaned });
            }
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Cache cleanup error', error);
        }
    }
    cacheUserBalance(userId, balance) {
        const key = `balance:${userId}`;
        this.set(key, balance, 2 * 60 * 1000);
    }
    getCachedUserBalance(userId) {
        const key = `balance:${userId}`;
        return this.get(key);
    }
    invalidateUserBalance(userId) {
        const key = `balance:${userId}`;
        this.delete(key);
    }
    cachePricingRules(service, resource, rules) {
        const key = `pricing:${service}:${resource}`;
        this.set(key, rules, 10 * 60 * 1000);
    }
    getCachedPricingRules(service, resource) {
        const key = `pricing:${service}:${resource}`;
        return this.get(key);
    }
    cacheCurrencyRate(from, to, rate) {
        const key = `currency:${from}:${to}`;
        this.set(key, rate, 60 * 60 * 1000);
    }
    getCachedCurrencyRate(from, to) {
        const key = `currency:${from}:${to}`;
        return this.get(key);
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = CacheService_1 = __decorate([
    (0, common_1.Injectable)()
], CacheService);
//# sourceMappingURL=cache.service.js.map