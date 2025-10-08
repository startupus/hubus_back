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
var AnalyticsCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsCacheService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@ai-aggregator/shared");
class RedisService {
    async get(key) {
        console.log(`Redis GET: ${key}`);
        return null;
    }
    async set(key, value, ttl) {
        console.log(`Redis SET: ${key} = ${JSON.stringify(value)}${ttl ? ` (TTL: ${ttl})` : ''}`);
        return true;
    }
    async del(key) {
        console.log(`Redis DEL: ${key}`);
    }
    async exists(key) {
        console.log(`Redis EXISTS: ${key}`);
        return false;
    }
    async keys(pattern) {
        console.log(`Redis KEYS: ${pattern}`);
        return [];
    }
    async mget(keys) {
        console.log(`Redis MGET: ${keys.join(', ')}`);
        return [];
    }
    async clearPattern(pattern) {
        console.log(`Redis CLEAR PATTERN: ${pattern}`);
        return 0;
    }
}
let AnalyticsCacheService = AnalyticsCacheService_1 = class AnalyticsCacheService {
    redisService;
    logger = new common_1.Logger(AnalyticsCacheService_1.name);
    DASHBOARD_PREFIX = 'analytics:dashboard:';
    REPORT_PREFIX = 'analytics:report:';
    METRICS_PREFIX = 'analytics:metrics:';
    SESSION_PREFIX = 'analytics:session:';
    constructor(redisService) {
        this.redisService = redisService;
    }
    async cacheDashboardMetrics(metrics, ttl = 300) {
        try {
            const key = `${this.DASHBOARD_PREFIX}${metrics.timeRange}`;
            const data = {
                ...metrics,
                cachedAt: new Date().toISOString()
            };
            const success = await this.redisService.set(key, data, ttl);
            if (success) {
                shared_1.LoggerUtil.debug('analytics-service', 'Dashboard metrics cached successfully', {
                    timeRange: metrics.timeRange,
                    totalUsers: metrics.totalUsers,
                    totalRequests: metrics.totalRequests
                });
            }
            return success;
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to cache dashboard metrics', error, {
                timeRange: metrics.timeRange
            });
            return false;
        }
    }
    async getDashboardMetrics(timeRange) {
        try {
            const key = `${this.DASHBOARD_PREFIX}${timeRange}`;
            const data = await this.redisService.get(key);
            if (data) {
                shared_1.LoggerUtil.debug('analytics-service', 'Dashboard metrics retrieved from cache', {
                    timeRange,
                    totalUsers: data.totalUsers
                });
            }
            return data;
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to get dashboard metrics', error, { timeRange });
            return null;
        }
    }
    async cacheReport(reportId, report, ttl = 3600) {
        try {
            const key = `${this.REPORT_PREFIX}${reportId}`;
            const data = {
                ...report,
                generatedAt: report.generatedAt.toISOString(),
                expiresAt: report.expiresAt.toISOString(),
                cachedAt: new Date().toISOString()
            };
            const success = await this.redisService.set(key, data, ttl);
            if (success) {
                shared_1.LoggerUtil.debug('analytics-service', 'Report cached successfully', {
                    reportId,
                    type: report.type
                });
            }
            return success;
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to cache report', error, { reportId });
            return false;
        }
    }
    async getReport(reportId) {
        try {
            const key = `${this.REPORT_PREFIX}${reportId}`;
            const data = await this.redisService.get(key);
            if (data) {
                shared_1.LoggerUtil.debug('analytics-service', 'Report retrieved from cache', {
                    reportId,
                    type: data.type
                });
            }
            return data;
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to get report', error, { reportId });
            return null;
        }
    }
    async cacheSystemMetrics(metrics, ttl = 1800) {
        try {
            const key = `${this.METRICS_PREFIX}${metrics.service}:${metrics.endpoint}:${Math.floor(metrics.timestamp.getTime() / 60000)}`;
            const data = {
                ...metrics,
                timestamp: metrics.timestamp.toISOString(),
                cachedAt: new Date().toISOString()
            };
            const success = await this.redisService.set(key, data, ttl);
            if (success) {
                shared_1.LoggerUtil.debug('analytics-service', 'System metrics cached successfully', {
                    service: metrics.service,
                    endpoint: metrics.endpoint,
                    responseTime: metrics.responseTime
                });
            }
            return success;
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to cache system metrics', error, {
                service: metrics.service
            });
            return false;
        }
    }
    async getSystemMetrics(service, endpoint, timeWindow = 60) {
        try {
            const pattern = `${this.METRICS_PREFIX}${service}:${endpoint}:*`;
            const keys = await this.redisService.keys(pattern);
            if (keys.length === 0) {
                return [];
            }
            const metrics = await this.redisService.mget(keys);
            const now = Date.now();
            const cutoff = now - (timeWindow * 60 * 1000);
            return metrics
                .filter(metric => metric && new Date(metric.timestamp).getTime() > cutoff)
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to get system metrics', error, {
                service,
                endpoint
            });
            return [];
        }
    }
    async cacheUserSession(sessionId, session, ttl = 7200) {
        try {
            const key = `${this.SESSION_PREFIX}${sessionId}`;
            const data = {
                ...session,
                startTime: session.startTime.toISOString(),
                endTime: session.endTime?.toISOString(),
                cachedAt: new Date().toISOString()
            };
            const success = await this.redisService.set(key, data, ttl);
            if (success) {
                shared_1.LoggerUtil.debug('analytics-service', 'User session cached successfully', {
                    sessionId,
                    userId: session.userId,
                    events: session.events
                });
            }
            return success;
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to cache user session', error, {
                sessionId,
                userId: session.userId
            });
            return false;
        }
    }
    async getUserSession(sessionId) {
        try {
            const key = `${this.SESSION_PREFIX}${sessionId}`;
            const data = await this.redisService.get(key);
            if (data) {
                shared_1.LoggerUtil.debug('analytics-service', 'User session retrieved from cache', {
                    sessionId,
                    userId: data.userId
                });
            }
            return data;
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to get user session', error, { sessionId });
            return null;
        }
    }
    async cacheAggregatedData(aggregationKey, data, ttl = 1800) {
        try {
            const key = `${this.METRICS_PREFIX}aggregated:${aggregationKey}`;
            const cacheData = {
                ...data,
                generatedAt: data.generatedAt.toISOString(),
                cachedAt: new Date().toISOString()
            };
            const success = await this.redisService.set(key, cacheData, ttl);
            if (success) {
                shared_1.LoggerUtil.debug('analytics-service', 'Aggregated data cached successfully', {
                    aggregationKey,
                    type: data.type,
                    timeRange: data.timeRange
                });
            }
            return success;
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to cache aggregated data', error, {
                aggregationKey
            });
            return false;
        }
    }
    async getAggregatedData(aggregationKey) {
        try {
            const key = `${this.METRICS_PREFIX}aggregated:${aggregationKey}`;
            const data = await this.redisService.get(key);
            if (data) {
                shared_1.LoggerUtil.debug('analytics-service', 'Aggregated data retrieved from cache', {
                    aggregationKey,
                    type: data.type
                });
            }
            return data;
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to get aggregated data', error, {
                aggregationKey
            });
            return null;
        }
    }
    async clearCacheByPattern(pattern) {
        try {
            const deleted = await this.redisService.clearPattern(pattern);
            shared_1.LoggerUtil.info('analytics-service', 'Cache cleared by pattern', {
                pattern,
                deleted
            });
            return deleted;
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to clear cache by pattern', error, { pattern });
            return 0;
        }
    }
    async clearAllCache() {
        try {
            const patterns = [
                `${this.DASHBOARD_PREFIX}*`,
                `${this.REPORT_PREFIX}*`,
                `${this.METRICS_PREFIX}*`,
                `${this.SESSION_PREFIX}*`
            ];
            let totalDeleted = 0;
            for (const pattern of patterns) {
                const deleted = await this.redisService.clearPattern(pattern);
                totalDeleted += deleted;
            }
            shared_1.LoggerUtil.info('analytics-service', 'All analytics cache cleared', {
                totalDeleted
            });
            return totalDeleted > 0;
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to clear all cache', error);
            return false;
        }
    }
    async getCacheStats() {
        try {
            const dashboardKeys = await this.redisService.keys(`${this.DASHBOARD_PREFIX}*`);
            const reportKeys = await this.redisService.keys(`${this.REPORT_PREFIX}*`);
            const metricsKeys = await this.redisService.keys(`${this.METRICS_PREFIX}*`);
            const sessionKeys = await this.redisService.keys(`${this.SESSION_PREFIX}*`);
            return {
                totalDashboards: dashboardKeys.length,
                totalReports: reportKeys.length,
                totalMetrics: metricsKeys.length,
                totalSessions: sessionKeys.length
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to get cache stats', error);
            return {
                totalDashboards: 0,
                totalReports: 0,
                totalMetrics: 0,
                totalSessions: 0
            };
        }
    }
};
exports.AnalyticsCacheService = AnalyticsCacheService;
exports.AnalyticsCacheService = AnalyticsCacheService = AnalyticsCacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [RedisService])
], AnalyticsCacheService);
//# sourceMappingURL=analytics-cache.service.js.map