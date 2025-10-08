import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../../node_modules/.prisma/client';
import { ConfigService } from '@nestjs/config';
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        responseTime?: number;
        error?: string;
    }>;
    getDatabaseStats(): Promise<{
        totalEvents: number;
        totalMetrics: number;
        totalUsers: number;
        totalAlerts: number;
        databaseSize: string;
    }>;
    cleanupOldData(retentionDays?: number): Promise<{
        deletedEvents: number;
        deletedMetrics: number;
        deletedAlerts: number;
    }>;
    createIndexes(): Promise<void>;
    getSlowQueries(): Promise<Array<{
        query: string;
        duration: number;
        timestamp: Date;
    }>>;
    optimizePerformance(): Promise<{
        vacuumed: boolean;
        analyzed: boolean;
        reindexed: boolean;
    }>;
}
