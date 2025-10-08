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
var ConcurrentAnalyticsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConcurrentAnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@ai-aggregator/shared");
const shared_2 = require("@ai-aggregator/shared");
const prisma_service_1 = require("../common/prisma/prisma.service");
class ThreadPoolService {
    async execute(task) {
        return await task();
    }
    async executeBatch(tasks) {
        return await Promise.all(tasks.map(task => task()));
    }
    async executeParallel(tasks, options) {
        console.log(`ThreadPool EXECUTE PARALLEL: ${tasks.length} tasks`);
        return await Promise.all(tasks.map(task => task()));
    }
}
let ConcurrentAnalyticsService = ConcurrentAnalyticsService_1 = class ConcurrentAnalyticsService {
    prisma;
    logger = new common_1.Logger(ConcurrentAnalyticsService_1.name);
    dashboardCache = new shared_2.ConcurrentCache();
    metricsCache = new shared_2.ConcurrentCache();
    reportCache = new shared_2.ConcurrentCache();
    totalEvents = new shared_2.AtomicCounter(0);
    processedEvents = new shared_2.AtomicCounter(0);
    failedEvents = new shared_2.AtomicCounter(0);
    totalUsers = new shared_2.AtomicCounter(0);
    totalRequests = new shared_2.AtomicCounter(0);
    eventQueue = new shared_2.ConcurrentQueue();
    aggregationQueue = new shared_2.ConcurrentQueue();
    aggregationLocks = new shared_2.ConcurrentMap();
    threadPool;
    realtimeMetrics = new shared_2.ConcurrentMap();
    constructor(prisma, threadPool) {
        this.prisma = prisma;
        this.threadPool = threadPool;
        this.startEventProcessor();
        this.startAggregationProcessor();
        this.startMetricsAggregator();
    }
    async recordEvent(userId, eventType, eventName, service, properties, metadata, timestamp = new Date()) {
        try {
            const eventId = this.generateEventId();
            const success = this.eventQueue.enqueue({
                eventId,
                userId,
                eventType,
                eventName,
                service,
                properties,
                metadata,
                timestamp,
                resolve: () => { },
                reject: () => { }
            });
            if (success) {
                this.totalEvents.increment();
                if (userId) {
                    this.totalUsers.increment();
                }
                shared_1.LoggerUtil.debug('analytics-service', 'Event queued for processing', {
                    eventId,
                    userId,
                    eventType,
                    eventName,
                    service
                });
                return { success: true, eventId };
            }
            else {
                shared_1.LoggerUtil.warn('analytics-service', 'Event queue is full', { userId, eventType });
                return { success: false, error: 'Event queue is full' };
            }
        }
        catch (error) {
            this.failedEvents.increment();
            shared_1.LoggerUtil.error('analytics-service', 'Failed to record event', error, { userId, eventType });
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    async recordBatchEvents(events) {
        try {
            const tasks = events.map(event => () => this.recordEvent(event.userId, event.eventType, event.eventName, event.service, event.properties, event.metadata, event.timestamp));
            const results = await this.threadPool.executeParallel(tasks, {
                maxConcurrency: 20,
                timeout: 30000
            });
            return results;
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to record batch events', error);
            return events.map(() => ({
                success: false,
                error: 'Batch processing failed'
            }));
        }
    }
    async getDashboardMetrics(timeRange) {
        try {
            const cached = this.dashboardCache.get(timeRange);
            if (cached && (Date.now() - cached.lastUpdated.getTime()) < 300000) {
                shared_1.LoggerUtil.debug('analytics-service', 'Dashboard metrics retrieved from cache', { timeRange });
                return cached.data;
            }
            const metrics = await this.calculateDashboardMetrics(timeRange);
            this.dashboardCache.set(timeRange, {
                data: metrics,
                timeRange,
                lastUpdated: new Date()
            });
            shared_1.LoggerUtil.info('analytics-service', 'Dashboard metrics calculated', {
                timeRange,
                totalUsers: metrics.totalUsers,
                totalRequests: metrics.totalRequests
            });
            return metrics;
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to get dashboard metrics', error, { timeRange });
            throw error;
        }
    }
    async aggregateMetrics(type, timeRange, dimensions, filters) {
        try {
            const aggregationId = this.generateAggregationId();
            const cacheKey = `${type}:${timeRange}:${JSON.stringify(dimensions)}:${JSON.stringify(filters)}`;
            const cached = this.metricsCache.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp.getTime()) < 1800000) {
                shared_1.LoggerUtil.debug('analytics-service', 'Aggregated metrics retrieved from cache', { aggregationId });
                return { success: true, data: cached.metrics };
            }
            const aggregationLock = this.getAggregationLock(cacheKey);
            await this.acquireLock(aggregationLock);
            try {
                const aggregatedData = await this.performAggregation(type, timeRange, dimensions, filters);
                this.metricsCache.set(cacheKey, {
                    metrics: aggregatedData,
                    timestamp: new Date()
                });
                shared_1.LoggerUtil.info('analytics-service', 'Metrics aggregated successfully', {
                    aggregationId,
                    type,
                    timeRange,
                    dimensions
                });
                return { success: true, data: aggregatedData };
            }
            finally {
                this.releaseLock(aggregationLock);
            }
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to aggregate metrics', error, { type, timeRange });
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    async aggregateBatchMetrics(aggregations) {
        try {
            const tasks = aggregations.map(aggregation => () => this.aggregateMetrics(aggregation.type, aggregation.timeRange, aggregation.dimensions, aggregation.filters));
            const results = await this.threadPool.executeParallel(tasks, {
                maxConcurrency: 10,
                timeout: 60000
            });
            return results;
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to aggregate batch metrics', error);
            return aggregations.map(() => ({
                success: false,
                error: 'Batch aggregation failed'
            }));
        }
    }
    async updateRealtimeMetrics(metricName, value, timestamp = new Date()) {
        try {
            const existing = this.realtimeMetrics.get(metricName);
            if (existing) {
                const newValue = (existing.value * existing.count + value) / (existing.count + 1);
                this.realtimeMetrics.set(metricName, {
                    value: newValue,
                    timestamp,
                    count: existing.count + 1
                });
            }
            else {
                this.realtimeMetrics.set(metricName, {
                    value,
                    timestamp,
                    count: 1
                });
            }
            shared_1.LoggerUtil.debug('analytics-service', 'Realtime metric updated', {
                metricName,
                value,
                timestamp
            });
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to update realtime metrics', error, { metricName });
        }
    }
    async getRealtimeMetrics() {
        try {
            const metrics = [];
            for (const [name, data] of this.realtimeMetrics) {
                metrics.push({
                    name,
                    value: data.value,
                    timestamp: data.timestamp,
                    count: data.count
                });
            }
            return metrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to get realtime metrics', error);
            return [];
        }
    }
    startEventProcessor() {
        const processEvents = async () => {
            while (true) {
                try {
                    const event = this.eventQueue.dequeueBlocking(1000);
                    if (!event) {
                        continue;
                    }
                    await this.processEvent(event);
                }
                catch (error) {
                    shared_1.LoggerUtil.error('analytics-service', 'Failed to process event from queue', error);
                }
            }
        };
        setImmediate(processEvents);
    }
    startAggregationProcessor() {
        const processAggregations = async () => {
            while (true) {
                try {
                    const aggregation = this.aggregationQueue.dequeueBlocking(1000);
                    if (!aggregation) {
                        continue;
                    }
                    await this.processAggregation(aggregation);
                }
                catch (error) {
                    shared_1.LoggerUtil.error('analytics-service', 'Failed to process aggregation from queue', error);
                }
            }
        };
        setImmediate(processAggregations);
    }
    startMetricsAggregator() {
        const aggregateMetrics = async () => {
            while (true) {
                try {
                    await this.performRealtimeAggregation();
                    await new Promise(resolve => setTimeout(resolve, 30000));
                }
                catch (error) {
                    shared_1.LoggerUtil.error('analytics-service', 'Realtime aggregation error', error);
                }
            }
        };
        setImmediate(aggregateMetrics);
    }
    async processEvent(event) {
        try {
            await this.prisma.analyticsEvent.create({
                data: {
                    userId: event.userId,
                    eventType: event.eventType,
                    eventName: event.eventName,
                    service: event.service,
                    properties: event.properties,
                    metadata: event.metadata,
                    timestamp: event.timestamp
                }
            });
            await this.updateRealtimeMetrics('total_events', 1);
            await this.updateRealtimeMetrics(`events_${event.service}`, 1);
            this.processedEvents.increment();
            shared_1.LoggerUtil.debug('analytics-service', 'Event processed successfully', {
                eventId: event.eventId,
                eventType: event.eventType
            });
        }
        catch (error) {
            this.failedEvents.increment();
            shared_1.LoggerUtil.error('analytics-service', 'Failed to process event', error, {
                eventId: event.eventId
            });
        }
    }
    async processAggregation(aggregation) {
        try {
            const result = await this.performAggregation(aggregation.type, aggregation.timeRange, aggregation.dimensions, aggregation.filters);
            aggregation.resolve(result);
            shared_1.LoggerUtil.debug('analytics-service', 'Aggregation processed successfully', {
                aggregationId: aggregation.aggregationId,
                type: aggregation.type
            });
        }
        catch (error) {
            aggregation.reject(error);
            shared_1.LoggerUtil.error('analytics-service', 'Failed to process aggregation', error, {
                aggregationId: aggregation.aggregationId
            });
        }
    }
    async calculateDashboardMetrics(timeRange) {
        try {
            return {
                totalUsers: this.totalUsers.get(),
                totalRequests: this.totalRequests.get(),
                averageResponseTime: 150,
                successRate: 0.95,
                errorRate: 0.05,
                topServices: [
                    { service: 'billing-service', requests: 1000 },
                    { service: 'auth-service', requests: 800 },
                    { service: 'proxy-service', requests: 600 }
                ],
                topUsers: [
                    { userId: 'user1', requests: 100 },
                    { userId: 'user2', requests: 80 },
                    { userId: 'user3', requests: 60 }
                ]
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to calculate dashboard metrics', error);
            throw error;
        }
    }
    async performAggregation(type, timeRange, dimensions, filters) {
        try {
            return {
                type,
                timeRange,
                dimensions,
                filters,
                data: {
                    count: 1000,
                    sum: 50000,
                    average: 50,
                    min: 1,
                    max: 1000
                },
                generatedAt: new Date()
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to perform aggregation', error);
            throw error;
        }
    }
    async performRealtimeAggregation() {
        try {
            const metrics = await this.getRealtimeMetrics();
            shared_1.LoggerUtil.debug('analytics-service', 'Realtime aggregation completed', {
                metricsCount: metrics.length
            });
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to perform realtime aggregation', error);
        }
    }
    getAggregationLock(key) {
        if (!this.aggregationLocks.has(key)) {
            this.aggregationLocks.set(key, new Int32Array(new SharedArrayBuffer(4)));
        }
        return this.aggregationLocks.get(key);
    }
    async acquireLock(lock) {
        while (!Atomics.compareExchange(lock, 0, 0, 1)) {
            Atomics.wait(lock, 0, 1);
        }
    }
    releaseLock(lock) {
        Atomics.store(lock, 0, 0);
        Atomics.notify(lock, 0, 1);
    }
    generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateAggregationId() {
        return `agg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getStats() {
        return {
            totalEvents: this.totalEvents.get(),
            processedEvents: this.processedEvents.get(),
            failedEvents: this.failedEvents.get(),
            totalUsers: this.totalUsers.get(),
            totalRequests: this.totalRequests.get(),
            queueSize: this.eventQueue.size(),
            realtimeMetricsCount: this.realtimeMetrics.size(),
            cacheStats: {
                dashboardCache: this.dashboardCache.size(),
                metricsCache: this.metricsCache.size(),
                reportCache: this.reportCache.size()
            }
        };
    }
    async clearCache() {
        try {
            this.dashboardCache.cleanup();
            this.metricsCache.cleanup();
            this.reportCache.cleanup();
            shared_1.LoggerUtil.info('analytics-service', 'Cache cleared successfully');
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to clear cache', error);
        }
    }
};
exports.ConcurrentAnalyticsService = ConcurrentAnalyticsService;
exports.ConcurrentAnalyticsService = ConcurrentAnalyticsService = ConcurrentAnalyticsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ThreadPoolService])
], ConcurrentAnalyticsService);
//# sourceMappingURL=concurrent-analytics.service.js.map