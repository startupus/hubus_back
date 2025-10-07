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
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../../../node_modules/.prisma/client");
const config_1 = require("@nestjs/config");
const shared_1 = require("@ai-aggregator/shared");
let PrismaService = class PrismaService extends client_1.PrismaClient {
    configService;
    constructor(configService) {
        super({
            datasources: {
                db: {
                    url: configService.get('AUTH_DATABASE_URL'),
                },
            },
            log: [
                { level: 'query', emit: 'event' },
                { level: 'error', emit: 'event' },
                { level: 'info', emit: 'event' },
                { level: 'warn', emit: 'event' },
            ],
        });
        this.configService = configService;
        if (configService.get('NODE_ENV') === 'development') {
        }
    }
    async onModuleInit() {
        try {
            await this.$connect();
            shared_1.LoggerUtil.info('auth-service', 'Database connected successfully');
        }
        catch (error) {
            shared_1.LoggerUtil.fatal('auth-service', 'Failed to connect to database', error);
            throw error;
        }
    }
    async onModuleDestroy() {
        try {
            await this.$disconnect();
            shared_1.LoggerUtil.info('auth-service', 'Database disconnected successfully');
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Error disconnecting from database', error);
        }
    }
    async cleanupExpiredTokens() {
        try {
            const now = new Date();
            const expiredRefreshTokens = await this.refreshToken.deleteMany({
                where: {
                    expiresAt: {
                        lt: now,
                    },
                },
            });
            const expiredPasswordResetTokens = await this.passwordResetToken.deleteMany({
                where: {
                    expiresAt: {
                        lt: now,
                    },
                },
            });
            const expiredEmailVerificationTokens = await this.emailVerificationToken.deleteMany({
                where: {
                    expiresAt: {
                        lt: now,
                    },
                },
            });
            shared_1.LoggerUtil.info('auth-service', 'Cleaned up expired tokens', {
                refreshTokens: expiredRefreshTokens.count,
                passwordResetTokens: expiredPasswordResetTokens.count,
                emailVerificationTokens: expiredEmailVerificationTokens.count,
            });
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Error cleaning up expired tokens', error);
        }
    }
    async getHealthStatus() {
        const start = Date.now();
        try {
            await this.$queryRaw `SELECT 1`;
            return {
                status: 'healthy',
                responseTime: Date.now() - start,
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                responseTime: Date.now() - start,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map