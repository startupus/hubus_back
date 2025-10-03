import { PrismaService } from '../../common/prisma/prisma.service';
import { SecurityEvent } from '@ai-aggregator/shared';
export declare class SecurityService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getUserSecurityEvents(userId: string, page?: number, limit?: number): Promise<{
        events: SecurityEvent[];
        total: number;
    }>;
    getUserLoginAttempts(email: string, page?: number, limit?: number): Promise<{
        attempts: any[];
        total: number;
    }>;
    isUserLockedOut(email: string, ipAddress: string): Promise<boolean>;
    private mapSecurityEventToDto;
}
