import { DataCollectionService } from '../services/data-collection.service';
import { PrismaService } from '../common/prisma/prisma.service';
declare class RabbitMQService {
    publish(queue: string, message: any): Promise<boolean>;
    subscribe(queue: string, handler: (message: any) => Promise<void>): Promise<boolean>;
    publishCriticalMessage(queue: string, message: any, options?: any): Promise<boolean>;
    subscribeToCriticalMessages(queue: string, handler: (message: any) => Promise<boolean>): Promise<boolean>;
}
export declare class CriticalOperationsService {
    private readonly rabbitmqService;
    private readonly dataCollectionService;
    private readonly prisma;
    private readonly logger;
    constructor(rabbitmqService: RabbitMQService, dataCollectionService: DataCollectionService, prisma: PrismaService);
    initializeCriticalHandlers(): Promise<void>;
    publishCriticalEvent(data: {
        userId: string;
        eventType: string;
        eventName: string;
        service: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        properties: Record<string, any>;
        metadata?: Record<string, any>;
    }): Promise<boolean>;
    publishPerformanceMetrics(data: {
        service: string;
        endpoint: string;
        responseTime: number;
        statusCode: number;
        memoryUsage: number;
        cpuUsage: number;
        timestamp: Date;
        metadata?: Record<string, any>;
    }): Promise<boolean>;
    publishSecurityAudit(data: {
        userId: string;
        action: string;
        resource: string;
        ipAddress: string;
        userAgent: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        riskScore: number;
        metadata?: Record<string, any>;
    }): Promise<boolean>;
    private handleAnalyticsEvents;
    private handleCriticalEvents;
    private handlePerformanceMetrics;
    private handleSecurityAudit;
    private updateUserAnalytics;
    private handleSyncData;
    private sendCriticalAlert;
    private sendSecurityAlert;
    private checkPerformanceAnomalies;
    private getPriorityBySeverity;
}
export {};
