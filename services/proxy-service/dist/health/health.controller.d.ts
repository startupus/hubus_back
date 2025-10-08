export declare class HealthController {
    getHealth(): {
        status: string;
        timestamp: string;
        service: string;
        version: string;
        uptime: number;
    };
}
