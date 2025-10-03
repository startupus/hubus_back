import { ConfigService } from '@nestjs/config';
import { HealthCheck } from '@ai-aggregator/shared';
export declare class HealthService {
    private readonly configService;
    private readonly startTime;
    constructor(configService: ConfigService);
    getHealth(): Promise<HealthCheck>;
    getReadiness(): Promise<{
        status: string;
        timestamp: string;
    }>;
    getLiveness(): Promise<{
        status: string;
        timestamp: string;
    }>;
    private checkRedis;
    private checkRabbitMQ;
}
