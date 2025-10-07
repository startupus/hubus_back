"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const shared_1 = require("@ai-aggregator/shared");
let SecurityService = class SecurityService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getUserSecurityEvents(userId, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            const [events, total] = await Promise.all([
                this.prisma.securityEvent.findMany({
                    where: { ownerId: userId, ownerType: 'user' },
                    skip,
                    take: limit,
                    orderBy: { timestamp: 'desc' },
                }),
                this.prisma.securityEvent.count({
                    where: { ownerId: userId, ownerType: 'user' },
                }),
            ]);
            return {
                events: events.map(event => this.mapSecurityEventToDto(event)),
                total,
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to get security events', error, { userId });
            throw error;
        }
    }
    async getUserLoginAttempts(email, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            const [attempts, total] = await Promise.all([
                this.prisma.loginAttempt.findMany({
                    where: { email },
                    skip,
                    take: limit,
                    orderBy: { timestamp: 'desc' },
                }),
                this.prisma.loginAttempt.count({
                    where: { email },
                }),
            ]);
            return {
                attempts: attempts.map(attempt => ({
                    id: attempt.id,
                    email: attempt.email,
                    ipAddress: attempt.ipAddress,
                    userAgent: attempt.userAgent,
                    success: attempt.success,
                    failureReason: attempt.failureReason,
                    timestamp: attempt.timestamp,
                })),
                total,
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to get login attempts', error, { email });
            throw error;
        }
    }
    async isUserLockedOut(email, ipAddress) {
        try {
            const lockoutDuration = 15 * 60 * 1000;
            const maxAttempts = 5;
            const lockoutTime = new Date(Date.now() - lockoutDuration);
            const recentFailedAttempts = await this.prisma.loginAttempt.count({
                where: {
                    OR: [
                        { email, success: false, timestamp: { gte: lockoutTime } },
                        { ipAddress, success: false, timestamp: { gte: lockoutTime } },
                    ],
                },
            });
            return recentFailedAttempts >= maxAttempts;
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to check user lockout status', error, { email, ipAddress });
            return false;
        }
    }
    mapSecurityEventToDto(event) {
        return {
            id: event.id,
            userId: event.userId,
            type: event.type,
            severity: event.severity,
            description: event.description,
            ipAddress: event.ipAddress,
            userAgent: event.userAgent,
            metadata: event.metadata,
            timestamp: event.timestamp,
        };
    }
};
exports.SecurityService = SecurityService;
exports.SecurityService = SecurityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SecurityService);
//# sourceMappingURL=security.service.js.map