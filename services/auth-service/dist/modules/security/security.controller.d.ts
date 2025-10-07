import { Request } from 'express';
import { SecurityService } from './security.service';
export declare class SecurityController {
    private readonly securityService;
    constructor(securityService: SecurityService);
    getSecurityEvents(page: number, limit: number, req: Request): Promise<{
        events: import("@ai-aggregator/shared").SecurityEvent[];
        total: number;
    }>;
    getLoginAttempts(page: number, limit: number, req: Request): Promise<{
        attempts: any[];
        total: number;
    }>;
}
