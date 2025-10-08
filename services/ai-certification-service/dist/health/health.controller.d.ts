import { HealthService } from './health.service';
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthService);
    getHealth(): Promise<{
        service: string;
        status: string;
        timestamp: string;
        version: string;
        uptime: number;
        dependencies: {
            database: {
                status: string;
                responseTime: number;
            };
            redis: {
                status: string;
                responseTime: number;
            };
            rabbitmq: {
                status: string;
                responseTime: number;
            };
        };
    }>;
    getReadiness(): Promise<{
        service: string;
        status: string;
        timestamp: string;
    }>;
    getLiveness(): Promise<{
        service: string;
        status: string;
        timestamp: string;
    }>;
}
