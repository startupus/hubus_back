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
var ApiMonitorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiMonitorService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const logger_util_1 = require("../utils/logger.util");
let ApiMonitorService = ApiMonitorService_1 = class ApiMonitorService {
    configService;
    logger = new common_1.Logger(ApiMonitorService_1.name);
    metrics = [];
    maxMetrics = 1000; // Keep last 1000 metrics
    healthChecks = new Map();
    constructor(configService) {
        this.configService = configService;
    }
    /**
     * Record API metrics
     */
    recordMetric(metric) {
        const fullMetric = {
            ...metric,
            timestamp: new Date(),
        };
        this.metrics.push(fullMetric);
        // Keep only last maxMetrics entries
        if (this.metrics.length > this.maxMetrics) {
            this.metrics = this.metrics.slice(-this.maxMetrics);
        }
        // Log performance issues
        if (metric.responseTime > 5000) {
            logger_util_1.LoggerUtil.warn('api-monitor', 'Slow API response detected', {
                endpoint: metric.endpoint,
                method: metric.method,
                responseTime: metric.responseTime,
                statusCode: metric.statusCode,
            });
        }
        // Log errors
        if (metric.statusCode >= 400) {
            logger_util_1.LoggerUtil.error('api-monitor', 'API error detected', {
                endpoint: metric.endpoint,
                method: metric.method,
                statusCode: metric.statusCode,
                error: metric.error,
            });
        }
    }
    /**
     * Get API metrics for a specific time range
     */
    getMetrics(startTime, endTime, endpoint) {
        let filteredMetrics = this.metrics;
        if (startTime) {
            filteredMetrics = filteredMetrics.filter(m => m.timestamp >= startTime);
        }
        if (endTime) {
            filteredMetrics = filteredMetrics.filter(m => m.timestamp <= endTime);
        }
        if (endpoint) {
            filteredMetrics = filteredMetrics.filter(m => m.endpoint === endpoint);
        }
        return filteredMetrics;
    }
    /**
     * Get performance statistics
     */
    getPerformanceStats(startTime, endTime, endpoint) {
        const metrics = this.getMetrics(startTime, endTime, endpoint);
        if (metrics.length === 0) {
            return {
                totalRequests: 0,
                averageResponseTime: 0,
                errorRate: 0,
                p95ResponseTime: 0,
                p99ResponseTime: 0,
                statusCodeDistribution: {},
            };
        }
        const responseTimes = metrics.map(m => m.responseTime).sort((a, b) => a - b);
        const errorCount = metrics.filter(m => m.statusCode >= 400).length;
        const statusCodeDistribution = metrics.reduce((acc, m) => {
            acc[m.statusCode] = (acc[m.statusCode] || 0) + 1;
            return acc;
        }, {});
        return {
            totalRequests: metrics.length,
            averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
            errorRate: (errorCount / metrics.length) * 100,
            p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)],
            p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)],
            statusCodeDistribution,
        };
    }
    /**
     * Update service health
     */
    updateServiceHealth(serviceName, health) {
        this.healthChecks.set(serviceName, health);
        if (health.status === 'unhealthy') {
            logger_util_1.LoggerUtil.error('api-monitor', 'Service health check failed', {
                serviceName,
                status: health.status,
                uptime: health.uptime,
                memoryUsage: health.memoryUsage,
            });
        }
    }
    /**
     * Get all service health statuses
     */
    getAllServiceHealth() {
        return Array.from(this.healthChecks.values());
    }
    /**
     * Get service health by name
     */
    getServiceHealth(serviceName) {
        return this.healthChecks.get(serviceName);
    }
    /**
     * Check if any services are unhealthy
     */
    hasUnhealthyServices() {
        return Array.from(this.healthChecks.values()).some(health => health.status === 'unhealthy');
    }
    /**
     * Get system overview
     */
    getSystemOverview() {
        const services = this.getAllServiceHealth();
        const healthyCount = services.filter(s => s.status === 'healthy').length;
        const degradedCount = services.filter(s => s.status === 'degraded').length;
        const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;
        let overallStatus = 'healthy';
        if (unhealthyCount > 0) {
            overallStatus = 'unhealthy';
        }
        else if (degradedCount > 0) {
            overallStatus = 'degraded';
        }
        // Get metrics from last hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentStats = this.getPerformanceStats(oneHourAgo);
        return {
            totalServices: services.length,
            healthyServices: healthyCount,
            degradedServices: degradedCount,
            unhealthyServices: unhealthyCount,
            overallStatus,
            recentMetrics: {
                totalRequests: recentStats.totalRequests,
                averageResponseTime: recentStats.averageResponseTime,
                errorRate: recentStats.errorRate,
            },
        };
    }
    /**
     * Clear old metrics
     */
    clearOldMetrics(olderThanHours = 24) {
        const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
        const initialLength = this.metrics.length;
        this.metrics = this.metrics.filter(m => m.timestamp > cutoffTime);
        const removedCount = initialLength - this.metrics.length;
        if (removedCount > 0) {
            logger_util_1.LoggerUtil.info('api-monitor', 'Cleared old metrics', {
                removedCount,
                remainingCount: this.metrics.length,
            });
        }
    }
    /**
     * Export metrics for external monitoring
     */
    exportMetrics() {
        return {
            metrics: this.metrics,
            healthChecks: this.getAllServiceHealth(),
            systemOverview: this.getSystemOverview(),
        };
    }
};
exports.ApiMonitorService = ApiMonitorService;
exports.ApiMonitorService = ApiMonitorService = ApiMonitorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ApiMonitorService);
//# sourceMappingURL=api-monitor.service.js.map