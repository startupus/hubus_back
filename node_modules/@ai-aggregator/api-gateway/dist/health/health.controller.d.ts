import { HealthService } from './health.service';
import { HealthCheck } from '@ai-aggregator/shared';
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthService);
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
