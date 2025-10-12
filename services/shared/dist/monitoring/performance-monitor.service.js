"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PerformanceMonitorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceMonitorService = void 0;
const common_1 = require("@nestjs/common");
const index_1 = require("../index");
/**
 * Performance Monitor Service для отслеживания производительности
 *
 * Обеспечивает:
 * - Метрики производительности в реальном времени
 * - Отслеживание медленных операций
 * - Статистику использования ресурсов
 * - Алерты при превышении лимитов
 */
let PerformanceMonitorService = PerformanceMonitorService_1 = class PerformanceMonitorService {
    logger = new common_1.Logger(PerformanceMonitorService_1.name);
    metrics = new Map();
    slowOperationThreshold = 1000; // 1 секунда
    memoryThreshold = 100 * 1024 * 1024; // 100 MB
    cpuThreshold = 80; // 80%
    // Метрики производительности
    responseTimes = new Map();
    errorRates = new Map();
    requestCounts = new Map();
    memoryUsage = new Map();
    cpuUsage = new Map();
    /**
     * Записать метрику времени отклика
     */
    recordResponseTime(operation, responseTime) {
        try {
            if (!this.responseTimes.has(operation)) {
                this.responseTimes.set(operation, []);
            }
            const times = this.responseTimes.get(operation);
            times.push(responseTime);
            // Храним только последние 1000 записей
            if (times.length > 1000) {
                times.shift();
            }
            // Проверяем на медленную операцию
            if (responseTime > this.slowOperationThreshold) {
                index_1.LoggerUtil.warn('performance-monitor', 'Slow operation detected', {
                    operation,
                    responseTime,
                    threshold: this.slowOperationThreshold,
                });
            }
            index_1.LoggerUtil.debug('performance-monitor', 'Response time recorded', {
                operation,
                responseTime,
            });
        }
        catch (error) {
            index_1.LoggerUtil.error('performance-monitor', 'Failed to record response time', error);
        }
    }
    /**
     * Записать метрику ошибки
     */
    recordError(operation, error) {
        try {
            const currentErrors = this.errorRates.get(operation) || 0;
            this.errorRates.set(operation, currentErrors + 1);
            index_1.LoggerUtil.error('performance-monitor', 'Error recorded', error, {
                operation,
            });
        }
        catch (err) {
            index_1.LoggerUtil.error('performance-monitor', 'Failed to record error', err);
        }
    }
    /**
     * Записать метрику запроса
     */
    recordRequest(operation) {
        try {
            const currentCount = this.requestCounts.get(operation) || 0;
            this.requestCounts.set(operation, currentCount + 1);
            index_1.LoggerUtil.debug('performance-monitor', 'Request recorded', {
                operation,
                count: currentCount + 1,
            });
        }
        catch (error) {
            index_1.LoggerUtil.error('performance-monitor', 'Failed to record request', error);
        }
    }
    /**
     * Записать метрику использования памяти
     */
    recordMemoryUsage(operation, memoryUsage) {
        try {
            if (!this.memoryUsage.has(operation)) {
                this.memoryUsage.set(operation, []);
            }
            const usage = this.memoryUsage.get(operation);
            usage.push(memoryUsage);
            // Храним только последние 100 записей
            if (usage.length > 100) {
                usage.shift();
            }
            // Проверяем на превышение лимита памяти
            if (memoryUsage > this.memoryThreshold) {
                index_1.LoggerUtil.warn('performance-monitor', 'High memory usage detected', {
                    operation,
                    memoryUsage: `${Math.round(memoryUsage / 1024 / 1024)} MB`,
                    threshold: `${Math.round(this.memoryThreshold / 1024 / 1024)} MB`,
                });
            }
            index_1.LoggerUtil.debug('performance-monitor', 'Memory usage recorded', {
                operation,
                memoryUsage: `${Math.round(memoryUsage / 1024 / 1024)} MB`,
            });
        }
        catch (error) {
            index_1.LoggerUtil.error('performance-monitor', 'Failed to record memory usage', error);
        }
    }
    /**
     * Записать метрику использования CPU
     */
    recordCpuUsage(operation, cpuUsage) {
        try {
            if (!this.cpuUsage.has(operation)) {
                this.cpuUsage.set(operation, []);
            }
            const usage = this.cpuUsage.get(operation);
            usage.push(cpuUsage);
            // Храним только последние 100 записей
            if (usage.length > 100) {
                usage.shift();
            }
            // Проверяем на превышение лимита CPU
            if (cpuUsage > this.cpuThreshold) {
                index_1.LoggerUtil.warn('performance-monitor', 'High CPU usage detected', {
                    operation,
                    cpuUsage: `${cpuUsage}%`,
                    threshold: `${this.cpuThreshold}%`,
                });
            }
            index_1.LoggerUtil.debug('performance-monitor', 'CPU usage recorded', {
                operation,
                cpuUsage: `${cpuUsage}%`,
            });
        }
        catch (error) {
            index_1.LoggerUtil.error('performance-monitor', 'Failed to record CPU usage', error);
        }
    }
    /**
     * Получить статистику производительности
     */
    getPerformanceStats() {
        try {
            const operations = Array.from(this.responseTimes.keys()).map(operation => {
                const responseTimes = this.responseTimes.get(operation) || [];
                const errorCount = this.errorRates.get(operation) || 0;
                const requestCount = this.requestCounts.get(operation) || 0;
                const memoryUsages = this.memoryUsage.get(operation) || [];
                const cpuUsages = this.cpuUsage.get(operation) || [];
                const avgResponseTime = responseTimes.length > 0
                    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
                    : 0;
                const maxResponseTime = responseTimes.length > 0
                    ? Math.max(...responseTimes)
                    : 0;
                const minResponseTime = responseTimes.length > 0
                    ? Math.min(...responseTimes)
                    : 0;
                const errorRate = requestCount > 0
                    ? (errorCount / requestCount) * 100
                    : 0;
                const avgMemoryUsage = memoryUsages.length > 0
                    ? memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length
                    : 0;
                const avgCpuUsage = cpuUsages.length > 0
                    ? cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length
                    : 0;
                return {
                    name: operation,
                    avgResponseTime: Math.round(avgResponseTime * 100) / 100,
                    maxResponseTime,
                    minResponseTime,
                    errorRate: Math.round(errorRate * 100) / 100,
                    requestCount,
                    avgMemoryUsage: Math.round(avgMemoryUsage / 1024 / 1024 * 100) / 100,
                    avgCpuUsage: Math.round(avgCpuUsage * 100) / 100,
                };
            });
            const memUsage = process.memoryUsage();
            const totalMemory = memUsage.heapTotal;
            const usedMemory = memUsage.heapUsed;
            const freeMemory = totalMemory - usedMemory;
            const memoryUsagePercent = (usedMemory / totalMemory) * 100;
            return {
                operations,
                system: {
                    totalMemory: Math.round(totalMemory / 1024 / 1024 * 100) / 100,
                    freeMemory: Math.round(freeMemory / 1024 / 1024 * 100) / 100,
                    usedMemory: Math.round(usedMemory / 1024 / 1024 * 100) / 100,
                    memoryUsagePercent: Math.round(memoryUsagePercent * 100) / 100,
                    uptime: Math.round(process.uptime()),
                    nodeVersion: process.version,
                },
            };
        }
        catch (error) {
            index_1.LoggerUtil.error('performance-monitor', 'Failed to get performance stats', error);
            return {
                operations: [],
                system: {
                    totalMemory: 0,
                    freeMemory: 0,
                    usedMemory: 0,
                    memoryUsagePercent: 0,
                    uptime: 0,
                    nodeVersion: 'unknown',
                },
            };
        }
    }
    /**
     * Очистить метрики
     */
    clearMetrics() {
        try {
            this.responseTimes.clear();
            this.errorRates.clear();
            this.requestCounts.clear();
            this.memoryUsage.clear();
            this.cpuUsage.clear();
            index_1.LoggerUtil.info('performance-monitor', 'Performance metrics cleared');
        }
        catch (error) {
            index_1.LoggerUtil.error('performance-monitor', 'Failed to clear metrics', error);
        }
    }
    /**
     * Получить метрики для конкретной операции
     */
    getOperationMetrics(operation) {
        try {
            const responseTimes = this.responseTimes.get(operation) || [];
            const errorCount = this.errorRates.get(operation) || 0;
            const requestCount = this.requestCounts.get(operation) || 0;
            const memoryUsages = this.memoryUsage.get(operation) || [];
            const cpuUsages = this.cpuUsage.get(operation) || [];
            if (responseTimes.length === 0 && requestCount === 0) {
                return null;
            }
            const avgResponseTime = responseTimes.length > 0
                ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
                : 0;
            const maxResponseTime = responseTimes.length > 0
                ? Math.max(...responseTimes)
                : 0;
            const minResponseTime = responseTimes.length > 0
                ? Math.min(...responseTimes)
                : 0;
            const errorRate = requestCount > 0
                ? (errorCount / requestCount) * 100
                : 0;
            const avgMemoryUsage = memoryUsages.length > 0
                ? memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length
                : 0;
            const avgCpuUsage = cpuUsages.length > 0
                ? cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length
                : 0;
            return {
                avgResponseTime: Math.round(avgResponseTime * 100) / 100,
                maxResponseTime,
                minResponseTime,
                errorRate: Math.round(errorRate * 100) / 100,
                requestCount,
                avgMemoryUsage: Math.round(avgMemoryUsage / 1024 / 1024 * 100) / 100,
                avgCpuUsage: Math.round(avgCpuUsage * 100) / 100,
            };
        }
        catch (error) {
            index_1.LoggerUtil.error('performance-monitor', 'Failed to get operation metrics', error);
            return null;
        }
    }
};
exports.PerformanceMonitorService = PerformanceMonitorService;
exports.PerformanceMonitorService = PerformanceMonitorService = PerformanceMonitorService_1 = __decorate([
    (0, common_1.Injectable)()
], PerformanceMonitorService);
//# sourceMappingURL=performance-monitor.service.js.map