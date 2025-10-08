export declare class HealthService {
    private readonly startTime;
    getHealth(): {
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
    };
    getReadiness(): {
        service: string;
        status: string;
        timestamp: string;
    };
    getLiveness(): {
        service: string;
        status: string;
        timestamp: string;
    };
}
