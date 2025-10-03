import { PrismaService } from '../common/prisma/prisma.service';
import { HealthCheck } from '@ai-aggregator/shared';
export declare class HealthService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getHealth(): Promise<HealthCheck>;
    getReadiness(): Promise<{
        status: string;
        timestamp: string;
    }>;
    getLiveness(): Promise<{
        status: string;
        timestamp: string;
    }>;
}
