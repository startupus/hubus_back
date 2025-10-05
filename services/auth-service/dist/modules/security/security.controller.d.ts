import { Request } from 'express';
import { SecurityService } from './security.service';
export declare class SecurityController {
    private readonly securityService;
    constructor(securityService: SecurityService);
    getSecurityEvents(page: number, limit: number, req: Request): Promise<{
        events: SecurityEvent[];
        total: number;
    }>;
    getLoginAttempts(page: number, limit: number, req: Request): Promise<{
        attempts: any[];
        total: number;
    }>;
}
