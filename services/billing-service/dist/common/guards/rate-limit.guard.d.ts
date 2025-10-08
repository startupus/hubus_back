import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
export declare class RateLimitGuard implements CanActivate {
    private reflector;
    private readonly requestCounts;
    private readonly defaultLimits;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
    private getRateLimitKey;
    private checkRateLimit;
    private getDefaultLimit;
    cleanup(): void;
    getStats(): {
        totalKeys: number;
        activeKeys: number;
    };
}
