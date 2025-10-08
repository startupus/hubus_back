export declare class HealthService {
    getHealth(): Promise<{
        status: string;
        timestamp: string;
        service: string;
        version: string;
        uptime: number;
        memory: NodeJS.MemoryUsage;
        database: {
            status: string;
            responseTime: string;
            timestamp: string;
        };
    }>;
    getReadiness(): Promise<{
        status: string;
        timestamp: string;
        checks: {
            database: {
                status: string;
                responseTime: string;
                timestamp: string;
            };
            service: string;
        };
    }>;
    getLiveness(): Promise<{
        status: string;
        timestamp: string;
        uptime: number;
    }>;
}
