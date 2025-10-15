import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
export declare class ConnectionPoolService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private readonly prisma;
    private readonly maxConnections;
    private readonly minConnections;
    private readonly connectionTimeout;
    private readonly retryAttempts;
    private readonly retryDelay;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    getPrismaClient(): PrismaClient;
    executeWithRetry<T>(operation: () => Promise<T>, operationName: string, maxRetries?: number): Promise<T>;
    executeTransactionWithRetry<T>(transaction: (prisma: PrismaClient) => Promise<T>, operationName: string, maxRetries?: number): Promise<T>;
    getConnectionStats(): Promise<{
        isConnected: boolean;
        uptime: number;
        maxConnections: number;
        minConnections: number;
    }>;
    healthCheck(): Promise<boolean>;
    runMigrations(): Promise<void>;
    clearConnections(): Promise<void>;
    private delay;
}
