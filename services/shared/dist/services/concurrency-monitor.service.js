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
var ConcurrencyMonitorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConcurrencyMonitorService = void 0;
const common_1 = require("@nestjs/common");
const logger_util_1 = require("../utils/logger.util");
/**
 * Concurrency Monitor Service для мониторинга многопоточности
 *
 * Обеспечивает:
 * - Мониторинг производительности потоков
 * - Обнаружение deadlocks и race conditions
 * - Статистику использования ресурсов
 * - Алерты при проблемах с производительностью
 */
let ConcurrencyMonitorService = ConcurrencyMonitorService_1 = class ConcurrencyMonitorService {
    logger = new common_1.Logger(ConcurrencyMonitorService_1.name);
    monitoringInterval;
    metrics = {
        totalThreads: 0,
        activeThreads: 0,
        blockedThreads: 0,
        deadlockCount: 0,
        raceConditionCount: 0,
        averageResponseTime: 0,
        throughput: 0,
        errorRate: 0
    };
    threadStats = new Map();
    deadlockDetector = new DeadlockDetector();
    performanceAnalyzer = new PerformanceAnalyzer();
    constructor() {
        this.monitoringInterval = setInterval(() => {
            this.performMonitoring();
        }, 5000); // Мониторинг каждые 5 секунд
    }
    async onModuleInit() {
        logger_util_1.LoggerUtil.info('shared', 'Concurrency monitor initialized');
    }
    async onModuleDestroy() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        logger_util_1.LoggerUtil.info('shared', 'Concurrency monitor destroyed');
    }
    /**
     * Регистрация нового потока для мониторинга
     */
    registerThread(threadId, metadata) {
        try {
            this.threadStats.set(threadId, {
                startTime: Date.now(),
                status: 'running',
                operations: 0,
                errors: 0
            });
            this.metrics.totalThreads++;
            this.metrics.activeThreads++;
            logger_util_1.LoggerUtil.debug('shared', 'Thread registered for monitoring', {
                threadId,
                totalThreads: this.metrics.totalThreads
            });
        }
        catch (error) {
            logger_util_1.LoggerUtil.error('shared', 'Failed to register thread', error, { threadId });
        }
    }
    /**
     * Обновление статуса потока
     */
    updateThreadStatus(threadId, status) {
        try {
            const threadStat = this.threadStats.get(threadId);
            if (!threadStat) {
                logger_util_1.LoggerUtil.warn('shared', 'Thread not found for status update', { threadId });
                return;
            }
            const oldStatus = threadStat.status;
            threadStat.status = status;
            if (status === 'blocked' && oldStatus !== 'blocked') {
                this.metrics.blockedThreads++;
            }
            else if (status !== 'blocked' && oldStatus === 'blocked') {
                this.metrics.blockedThreads--;
            }
            if (status === 'completed' || status === 'error') {
                threadStat.endTime = Date.now();
                this.metrics.activeThreads--;
            }
            logger_util_1.LoggerUtil.debug('shared', 'Thread status updated', {
                threadId,
                status,
                blockedThreads: this.metrics.blockedThreads
            });
        }
        catch (error) {
            logger_util_1.LoggerUtil.error('shared', 'Failed to update thread status', error, { threadId });
        }
    }
    /**
     * Запись операции потока
     */
    recordThreadOperation(threadId, operationTime, success) {
        try {
            const threadStat = this.threadStats.get(threadId);
            if (!threadStat) {
                return;
            }
            threadStat.operations++;
            if (!success) {
                threadStat.errors++;
            }
            // Обновляем среднее время ответа
            this.updateAverageResponseTime(operationTime);
            logger_util_1.LoggerUtil.debug('shared', 'Thread operation recorded', {
                threadId,
                operationTime,
                success,
                totalOperations: threadStat.operations
            });
        }
        catch (error) {
            logger_util_1.LoggerUtil.error('shared', 'Failed to record thread operation', error, { threadId });
        }
    }
    /**
     * Обнаружение deadlock
     */
    detectDeadlock(threadId, resources) {
        try {
            const isDeadlock = this.deadlockDetector.detect(threadId, resources);
            if (isDeadlock) {
                this.metrics.deadlockCount++;
                logger_util_1.LoggerUtil.warn('shared', 'Deadlock detected', {
                    threadId,
                    resources,
                    deadlockCount: this.metrics.deadlockCount
                });
            }
            return isDeadlock;
        }
        catch (error) {
            logger_util_1.LoggerUtil.error('shared', 'Failed to detect deadlock', error, { threadId });
            return false;
        }
    }
    /**
     * Обнаружение race condition
     */
    detectRaceCondition(threadId, resource) {
        try {
            const isRaceCondition = this.performanceAnalyzer.detectRaceCondition(threadId, resource);
            if (isRaceCondition) {
                this.metrics.raceConditionCount++;
                logger_util_1.LoggerUtil.warn('shared', 'Race condition detected', {
                    threadId,
                    resource,
                    raceConditionCount: this.metrics.raceConditionCount
                });
            }
            return isRaceCondition;
        }
        catch (error) {
            logger_util_1.LoggerUtil.error('shared', 'Failed to detect race condition', error, { threadId });
            return false;
        }
    }
    /**
     * Получение метрик производительности
     */
    getPerformanceMetrics() {
        const threadStats = Array.from(this.threadStats.entries()).map(([threadId, stats]) => ({
            threadId,
            duration: stats.endTime ? stats.endTime - stats.startTime : Date.now() - stats.startTime,
            operations: stats.operations,
            errors: stats.errors,
            status: stats.status
        }));
        return {
            ...this.metrics,
            threadStats
        };
    }
    /**
     * Получение рекомендаций по оптимизации
     */
    getOptimizationRecommendations() {
        const recommendations = [];
        // Проверяем deadlocks
        if (this.metrics.deadlockCount > 0) {
            recommendations.push({
                type: 'deadlock',
                severity: 'critical',
                message: `Detected ${this.metrics.deadlockCount} deadlocks`,
                recommendation: 'Review resource acquisition order and implement timeout mechanisms'
            });
        }
        // Проверяем race conditions
        if (this.metrics.raceConditionCount > 0) {
            recommendations.push({
                type: 'race_condition',
                severity: 'high',
                message: `Detected ${this.metrics.raceConditionCount} race conditions`,
                recommendation: 'Implement proper synchronization mechanisms and atomic operations'
            });
        }
        // Проверяем производительность
        if (this.metrics.averageResponseTime > 5000) {
            recommendations.push({
                type: 'performance',
                severity: 'medium',
                message: `Average response time is ${this.metrics.averageResponseTime}ms`,
                recommendation: 'Consider optimizing algorithms or increasing thread pool size'
            });
        }
        // Проверяем использование ресурсов
        if (this.metrics.blockedThreads > this.metrics.activeThreads * 0.5) {
            recommendations.push({
                type: 'resource_usage',
                severity: 'high',
                message: `${this.metrics.blockedThreads} threads are blocked`,
                recommendation: 'Review resource allocation and consider increasing available resources'
            });
        }
        return recommendations;
    }
    /**
     * Выполнение мониторинга
     */
    performMonitoring() {
        try {
            // Обновляем метрики
            this.updateMetrics();
            // Проверяем на проблемы
            this.checkForIssues();
            // Очищаем старые данные
            this.cleanupOldData();
            logger_util_1.LoggerUtil.debug('shared', 'Concurrency monitoring completed', {
                activeThreads: this.metrics.activeThreads,
                blockedThreads: this.metrics.blockedThreads,
                deadlockCount: this.metrics.deadlockCount
            });
        }
        catch (error) {
            logger_util_1.LoggerUtil.error('shared', 'Concurrency monitoring failed', error);
        }
    }
    /**
     * Обновление метрик
     */
    updateMetrics() {
        // Вычисляем throughput
        const totalOperations = Array.from(this.threadStats.values())
            .reduce((sum, stats) => sum + stats.operations, 0);
        this.metrics.throughput = totalOperations / 5; // Операций в секунду
        // Вычисляем error rate
        const totalErrors = Array.from(this.threadStats.values())
            .reduce((sum, stats) => sum + stats.errors, 0);
        this.metrics.errorRate = totalOperations > 0 ? totalErrors / totalOperations : 0;
    }
    /**
     * Проверка на проблемы
     */
    checkForIssues() {
        // Проверяем на высокий error rate
        if (this.metrics.errorRate > 0.1) {
            logger_util_1.LoggerUtil.warn('shared', 'High error rate detected', {
                errorRate: this.metrics.errorRate
            });
        }
        // Проверяем на большое количество заблокированных потоков
        if (this.metrics.blockedThreads > this.metrics.activeThreads * 0.8) {
            logger_util_1.LoggerUtil.warn('shared', 'High number of blocked threads', {
                blockedThreads: this.metrics.blockedThreads,
                activeThreads: this.metrics.activeThreads
            });
        }
        // Проверяем на низкий throughput
        if (this.metrics.throughput < 10) {
            logger_util_1.LoggerUtil.warn('shared', 'Low throughput detected', {
                throughput: this.metrics.throughput
            });
        }
    }
    /**
     * Очистка старых данных
     */
    cleanupOldData() {
        const now = Date.now();
        const maxAge = 300000; // 5 минут
        for (const [threadId, stats] of this.threadStats.entries()) {
            if (stats.endTime && (now - stats.endTime) > maxAge) {
                this.threadStats.delete(threadId);
            }
        }
    }
    /**
     * Обновление среднего времени ответа
     */
    updateAverageResponseTime(operationTime) {
        const alpha = 0.1; // Коэффициент сглаживания
        this.metrics.averageResponseTime =
            this.metrics.averageResponseTime * (1 - alpha) + operationTime * alpha;
    }
};
exports.ConcurrencyMonitorService = ConcurrencyMonitorService;
exports.ConcurrencyMonitorService = ConcurrencyMonitorService = ConcurrencyMonitorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ConcurrencyMonitorService);
/**
 * Детектор deadlock
 */
class DeadlockDetector {
    resourceGraph = new Map();
    threadResources = new Map();
    detect(threadId, resources) {
        try {
            // Обновляем граф ресурсов
            this.updateResourceGraph(threadId, resources);
            // Проверяем на циклы в графе
            return this.hasCycle();
        }
        catch (error) {
            return false;
        }
    }
    updateResourceGraph(threadId, resources) {
        this.threadResources.set(threadId, new Set(resources));
        for (const resource of resources) {
            if (!this.resourceGraph.has(resource)) {
                this.resourceGraph.set(resource, new Set());
            }
            // Добавляем связи между ресурсами
            for (const otherResource of resources) {
                if (resource !== otherResource) {
                    this.resourceGraph.get(resource).add(otherResource);
                }
            }
        }
    }
    hasCycle() {
        const visited = new Set();
        const recursionStack = new Set();
        for (const resource of this.resourceGraph.keys()) {
            if (!visited.has(resource)) {
                if (this.dfs(resource, visited, recursionStack)) {
                    return true;
                }
            }
        }
        return false;
    }
    dfs(resource, visited, recursionStack) {
        visited.add(resource);
        recursionStack.add(resource);
        const neighbors = this.resourceGraph.get(resource) || new Set();
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                if (this.dfs(neighbor, visited, recursionStack)) {
                    return true;
                }
            }
            else if (recursionStack.has(neighbor)) {
                return true; // Найден цикл
            }
        }
        recursionStack.delete(resource);
        return false;
    }
}
/**
 * Анализатор производительности
 */
class PerformanceAnalyzer {
    resourceAccess = new Map();
    detectRaceCondition(threadId, resource) {
        try {
            const now = Date.now();
            if (!this.resourceAccess.has(resource)) {
                this.resourceAccess.set(resource, []);
            }
            const accesses = this.resourceAccess.get(resource);
            accesses.push({ threadId, timestamp: now });
            // Очищаем старые записи (старше 1 секунды)
            const cutoff = now - 1000;
            const recentAccesses = accesses.filter(access => access.timestamp > cutoff);
            this.resourceAccess.set(resource, recentAccesses);
            // Проверяем на race condition (множественные потоки обращаются к ресурсу одновременно)
            if (recentAccesses.length > 1) {
                const uniqueThreads = new Set(recentAccesses.map(access => access.threadId));
                return uniqueThreads.size > 1;
            }
            return false;
        }
        catch (error) {
            return false;
        }
    }
}
//# sourceMappingURL=concurrency-monitor.service.js.map