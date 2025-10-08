export declare class HealthController {
    check(): {
        status: string;
        service: string;
        timestamp: string;
        uptime: number;
    };
    ready(): {
        status: string;
        service: string;
        timestamp: string;
    };
}
