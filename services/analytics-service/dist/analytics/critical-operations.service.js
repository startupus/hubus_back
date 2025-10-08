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
var CriticalOperationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CriticalOperationsService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@ai-aggregator/shared");
const data_collection_service_1 = require("../services/data-collection.service");
const prisma_service_1 = require("../common/prisma/prisma.service");
class RabbitMQService {
    async publish(queue, message) {
        console.log(`RabbitMQ PUBLISH to ${queue}:`, message);
        return true;
    }
    async subscribe(queue, handler) {
        console.log(`RabbitMQ SUBSCRIBE to ${queue}`);
        return true;
    }
    async publishCriticalMessage(queue, message, options) {
        console.log(`RabbitMQ PUBLISH CRITICAL to ${queue}:`, message, options);
        return true;
    }
    async subscribeToCriticalMessages(queue, handler) {
        console.log(`RabbitMQ SUBSCRIBE CRITICAL to ${queue}`);
        return true;
    }
}
let CriticalOperationsService = CriticalOperationsService_1 = class CriticalOperationsService {
    rabbitmqService;
    dataCollectionService;
    prisma;
    logger = new common_1.Logger(CriticalOperationsService_1.name);
    constructor(rabbitmqService, dataCollectionService, prisma) {
        this.rabbitmqService = rabbitmqService;
        this.dataCollectionService = dataCollectionService;
        this.prisma = prisma;
    }
    async initializeCriticalHandlers() {
        try {
            await this.rabbitmqService.subscribeToCriticalMessages('analytics.events', this.handleAnalyticsEvents.bind(this));
            await this.rabbitmqService.subscribeToCriticalMessages('analytics.critical.events', this.handleCriticalEvents.bind(this));
            await this.rabbitmqService.subscribeToCriticalMessages('analytics.performance.metrics', this.handlePerformanceMetrics.bind(this));
            await this.rabbitmqService.subscribeToCriticalMessages('analytics.security.audit', this.handleSecurityAudit.bind(this));
            await this.rabbitmqService.subscribeToCriticalMessages('analytics.sync.data', this.handleSyncData.bind(this));
            shared_1.LoggerUtil.info('analytics-service', 'Critical operations handlers initialized');
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to initialize critical handlers', error);
            throw error;
        }
    }
    async publishCriticalEvent(data) {
        try {
            shared_1.LoggerUtil.info('analytics-service', 'Publishing critical event', {
                userId: data.userId,
                eventType: data.eventType,
                severity: data.severity
            });
            return await this.rabbitmqService.publishCriticalMessage('analytics.critical.events', {
                operation: 'critical_event',
                ...data,
                timestamp: new Date().toISOString()
            }, {
                persistent: true,
                priority: this.getPriorityBySeverity(data.severity),
                expiration: '1800000'
            });
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to publish critical event', error, {
                userId: data.userId
            });
            return false;
        }
    }
    async publishPerformanceMetrics(data) {
        try {
            shared_1.LoggerUtil.info('analytics-service', 'Publishing performance metrics', {
                service: data.service,
                endpoint: data.endpoint,
                responseTime: data.responseTime
            });
            return await this.rabbitmqService.publishCriticalMessage('analytics.performance.metrics', {
                operation: 'performance_metrics',
                ...data,
                timestamp: data.timestamp.toISOString()
            }, {
                persistent: true,
                priority: 5,
                expiration: '900000'
            });
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to publish performance metrics', error, {
                service: data.service
            });
            return false;
        }
    }
    async publishSecurityAudit(data) {
        try {
            shared_1.LoggerUtil.info('analytics-service', 'Publishing security audit', {
                userId: data.userId,
                action: data.action,
                severity: data.severity,
                riskScore: data.riskScore
            });
            return await this.rabbitmqService.publishCriticalMessage('analytics.security.audit', {
                operation: 'security_audit',
                ...data,
                timestamp: new Date().toISOString()
            }, {
                persistent: true,
                priority: this.getPriorityBySeverity(data.severity),
                expiration: '3600000'
            });
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to publish security audit', error, {
                userId: data.userId
            });
            return false;
        }
    }
    async handleAnalyticsEvents(message) {
        try {
            shared_1.LoggerUtil.info('analytics-service', 'Processing analytics event', {
                messageId: message.messageId,
                userId: message.userId,
                eventType: message.eventType,
                eventName: message.eventName,
                service: message.service
            });
            const event = await this.prisma.analyticsEvent.create({
                data: {
                    userId: message.userId,
                    sessionId: message.sessionId,
                    eventType: message.eventType,
                    eventName: message.eventName,
                    service: message.service,
                    properties: message.properties || {},
                    metadata: {
                        ...message.metadata,
                        processedAt: new Date().toISOString(),
                        messageId: message.messageId,
                        source: 'rabbitmq'
                    },
                    timestamp: new Date(message.timestamp || new Date())
                }
            });
            if (message.eventType === 'ai_interaction') {
                await this.updateUserAnalytics(message.userId, message.properties);
            }
            shared_1.LoggerUtil.info('analytics-service', 'Analytics event processed successfully', {
                messageId: message.messageId,
                eventId: event.id
            });
            return true;
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to process analytics event', error, {
                messageId: message.messageId,
                userId: message.userId
            });
            return false;
        }
    }
    async handleCriticalEvents(message) {
        try {
            shared_1.LoggerUtil.info('analytics-service', 'Processing critical event', {
                messageId: message.messageId,
                userId: message.userId,
                eventType: message.eventType,
                severity: message.severity
            });
            const event = await this.prisma.analyticsEvent.create({
                data: {
                    userId: message.userId,
                    eventType: message.eventType,
                    eventName: message.eventName,
                    service: message.service,
                    properties: {
                        ...message.properties,
                        severity: message.severity,
                        critical: true
                    },
                    metadata: {
                        ...message.metadata,
                        processedAt: new Date().toISOString(),
                        messageId: message.messageId
                    },
                    timestamp: new Date(message.timestamp)
                }
            });
            if (message.severity === 'critical') {
                await this.sendCriticalAlert(event);
            }
            shared_1.LoggerUtil.info('analytics-service', 'Critical event processed successfully', {
                messageId: message.messageId,
                eventId: event.id
            });
            return true;
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to process critical event', error, {
                messageId: message.messageId,
                userId: message.userId
            });
            return false;
        }
    }
    async handlePerformanceMetrics(message) {
        try {
            shared_1.LoggerUtil.info('analytics-service', 'Processing performance metrics', {
                messageId: message.messageId,
                service: message.service,
                endpoint: message.endpoint
            });
            const metricsSnapshot = await this.prisma.metricsSnapshot.create({
                data: {
                    service: message.service,
                    metricType: 'performance',
                    metricName: 'response_time',
                    value: message.responseTime,
                    unit: 'ms',
                    labels: {
                        endpoint: message.endpoint,
                        statusCode: message.statusCode,
                        memoryUsage: message.memoryUsage,
                        cpuUsage: message.cpuUsage
                    },
                    timestamp: new Date(message.timestamp),
                    metadata: message.metadata || {}
                }
            });
            await this.checkPerformanceAnomalies(metricsSnapshot);
            shared_1.LoggerUtil.info('analytics-service', 'Performance metrics processed successfully', {
                messageId: message.messageId,
                snapshotId: metricsSnapshot.id
            });
            return true;
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to process performance metrics', error, {
                messageId: message.messageId,
                service: message.service
            });
            return false;
        }
    }
    async handleSecurityAudit(message) {
        try {
            shared_1.LoggerUtil.info('analytics-service', 'Processing security audit', {
                messageId: message.messageId,
                userId: message.userId,
                action: message.action,
                severity: message.severity
            });
            const auditRecord = await this.prisma.analyticsEvent.create({
                data: {
                    userId: message.userId,
                    eventType: 'security_audit',
                    eventName: message.action,
                    service: 'security-service',
                    properties: {
                        action: message.action,
                        resource: message.resource,
                        ipAddress: message.ipAddress,
                        userAgent: message.userAgent,
                        severity: message.severity,
                        riskScore: message.riskScore
                    },
                    metadata: {
                        ...message.metadata,
                        processedAt: new Date().toISOString(),
                        messageId: message.messageId
                    },
                    timestamp: new Date(message.timestamp)
                }
            });
            if (message.riskScore > 7 || message.severity === 'critical') {
                await this.sendSecurityAlert(auditRecord);
            }
            shared_1.LoggerUtil.info('analytics-service', 'Security audit processed successfully', {
                messageId: message.messageId,
                auditId: auditRecord.id
            });
            return true;
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to process security audit', error, {
                messageId: message.messageId,
                userId: message.userId
            });
            return false;
        }
    }
    async updateUserAnalytics(userId, properties) {
        try {
            if (!userId)
                return;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            await this.prisma.userAnalytics.upsert({
                where: { userId },
                update: {
                    totalRequests: { increment: 1 },
                    totalTokens: { increment: properties.tokensUsed || 0 },
                    totalCost: { increment: properties.cost || 0 },
                    lastActivity: new Date()
                },
                create: {
                    userId,
                    totalRequests: 1,
                    totalTokens: properties.tokensUsed || 0,
                    totalCost: properties.cost || 0,
                    lastActivity: new Date()
                }
            });
            await this.prisma.userUsageHistory.upsert({
                where: {
                    userId_date: {
                        userId,
                        date: today
                    }
                },
                update: {
                    requests: { increment: 1 },
                    tokens: { increment: properties.tokensUsed || 0 },
                    cost: { increment: properties.cost || 0 },
                    models: {
                        [properties.model || 'unknown']: { increment: 1 }
                    },
                    providers: {
                        [properties.provider || 'unknown']: { increment: 1 }
                    }
                },
                create: {
                    userId,
                    date: today,
                    requests: 1,
                    tokens: properties.tokensUsed || 0,
                    cost: properties.cost || 0,
                    models: {
                        [properties.model || 'unknown']: 1
                    },
                    providers: {
                        [properties.provider || 'unknown']: 1
                    }
                }
            });
            shared_1.LoggerUtil.debug('analytics-service', 'User analytics updated', {
                userId,
                tokensUsed: properties.tokensUsed,
                cost: properties.cost
            });
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to update user analytics', error, { userId });
        }
    }
    async handleSyncData(message) {
        try {
            shared_1.LoggerUtil.info('analytics-service', 'Processing data sync', {
                messageId: message.messageId,
                operation: message.operation
            });
            shared_1.LoggerUtil.info('analytics-service', 'Data sync completed', {
                messageId: message.messageId
            });
            return true;
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to sync data', error, {
                messageId: message.messageId
            });
            return false;
        }
    }
    async sendCriticalAlert(event) {
        try {
            shared_1.LoggerUtil.info('analytics-service', 'CRITICAL EVENT DETECTED', {
                eventId: event.id,
                userId: event.userId,
                eventType: event.eventType,
                eventName: event.eventName,
                service: event.service
            });
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to send critical alert', error);
        }
    }
    async sendSecurityAlert(auditRecord) {
        try {
            shared_1.LoggerUtil.info('analytics-service', 'SECURITY ALERT', {
                auditId: auditRecord.id,
                userId: auditRecord.userId,
                action: auditRecord.eventName,
                severity: auditRecord.properties.severity,
                riskScore: auditRecord.properties.riskScore
            });
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to send security alert', error);
        }
    }
    async checkPerformanceAnomalies(metricsSnapshot) {
        try {
            if (metricsSnapshot.responseTime > 5000) {
                shared_1.LoggerUtil.info('analytics-service', 'High response time detected', {
                    service: metricsSnapshot.service,
                    endpoint: metricsSnapshot.endpoint,
                    responseTime: metricsSnapshot.responseTime
                });
            }
            if (metricsSnapshot.memoryUsage > 0.9) {
                shared_1.LoggerUtil.info('analytics-service', 'High memory usage detected', {
                    service: metricsSnapshot.service,
                    memoryUsage: metricsSnapshot.memoryUsage
                });
            }
            if (metricsSnapshot.cpuUsage > 0.8) {
                shared_1.LoggerUtil.info('analytics-service', 'High CPU usage detected', {
                    service: metricsSnapshot.service,
                    cpuUsage: metricsSnapshot.cpuUsage
                });
            }
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to check performance anomalies', error);
        }
    }
    getPriorityBySeverity(severity) {
        switch (severity) {
            case 'critical': return 10;
            case 'high': return 8;
            case 'medium': return 5;
            case 'low': return 2;
            default: return 1;
        }
    }
};
exports.CriticalOperationsService = CriticalOperationsService;
exports.CriticalOperationsService = CriticalOperationsService = CriticalOperationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [RabbitMQService,
        data_collection_service_1.DataCollectionService,
        prisma_service_1.PrismaService])
], CriticalOperationsService);
//# sourceMappingURL=critical-operations.service.js.map