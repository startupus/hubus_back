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
exports.RateLimitGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const shared_1 = require("@ai-aggregator/shared");
let RateLimitGuard = class RateLimitGuard {
    constructor(reflector) {
        this.reflector = reflector;
        this.requestCounts = new Map();
        this.defaultLimits = {
            'getBalance': { requests: 100, window: 60000 },
            'updateBalance': { requests: 10, window: 60000 },
            'createTransaction': { requests: 20, window: 60000 },
            'processPayment': { requests: 5, window: 60000 },
            'trackUsage': { requests: 1000, window: 60000 },
            'calculateCost': { requests: 200, window: 60000 },
        };
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const handler = context.getHandler();
        const className = context.getClass().name;
        const rateLimit = this.reflector.get('rateLimit', handler) ||
            this.getDefaultLimit(handler.name) ||
            this.defaultLimits['getBalance'];
        const key = this.getRateLimitKey(request, handler.name);
        if (!this.checkRateLimit(key, rateLimit)) {
            shared_1.LoggerUtil.warn('billing-service', 'Rate limit exceeded', {
                key,
                limit: rateLimit,
                ip: request.ip,
                userId: request.user?.id || 'anonymous'
            });
            throw new common_1.HttpException(`Rate limit exceeded. Maximum ${rateLimit.requests} requests per ${rateLimit.window / 1000} seconds`, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        return true;
    }
    getRateLimitKey(request, operation) {
        const ip = request.ip || 'unknown';
        const userId = request.user?.id || request.body?.userId || 'anonymous';
        const criticalOperations = ['updateBalance', 'processPayment', 'createTransaction'];
        if (criticalOperations.includes(operation)) {
            return `${operation}:${userId}:${ip}`;
        }
        return `${operation}:${ip}`;
    }
    checkRateLimit(key, limit) {
        const now = Date.now();
        const current = this.requestCounts.get(key);
        if (!current) {
            this.requestCounts.set(key, { count: 1, resetTime: now + limit.window });
            return true;
        }
        if (now > current.resetTime) {
            this.requestCounts.set(key, { count: 1, resetTime: now + limit.window });
            return true;
        }
        if (current.count >= limit.requests) {
            return false;
        }
        current.count++;
        this.requestCounts.set(key, current);
        return true;
    }
    getDefaultLimit(operation) {
        return this.defaultLimits[operation] || null;
    }
    cleanup() {
        const now = Date.now();
        for (const [key, value] of this.requestCounts.entries()) {
            if (now > value.resetTime) {
                this.requestCounts.delete(key);
            }
        }
    }
    getStats() {
        const now = Date.now();
        let activeKeys = 0;
        for (const [key, value] of this.requestCounts.entries()) {
            if (now <= value.resetTime) {
                activeKeys++;
            }
        }
        return {
            totalKeys: this.requestCounts.size,
            activeKeys
        };
    }
};
exports.RateLimitGuard = RateLimitGuard;
exports.RateLimitGuard = RateLimitGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], RateLimitGuard);
//# sourceMappingURL=rate-limit.guard.js.map