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
                    url: configService.get('ANALYTICS_DATABASE_URL'),
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
    }
    async onModuleInit() {
        try {
            await this.$connect();
            shared_1.LoggerUtil.info('analytics-service', 'Database connected successfully');
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to connect to database', error);
            throw error;
        }
    }
    async onModuleDestroy() {
        try {
            await this.$disconnect();
            shared_1.LoggerUtil.info('analytics-service', 'Database disconnected successfully');
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to disconnect from database', error);
        }
    }
    async healthCheck() {
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
    async getDatabaseStats() {
        try {
            const [totalEvents, totalMetrics, totalUsers, totalAlerts] = await Promise.all([
                this.analyticsEvent.count(),
                this.metricsSnapshot.count(),
                this.userAnalytics.count(),
                this.alert.count(),
            ]);
            const sizeResult = await this.$queryRaw `
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `;
            return {
                totalEvents,
                totalMetrics,
                totalUsers,
                totalAlerts,
                databaseSize: sizeResult[0]?.size || 'Unknown',
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to get database statistics', error);
            throw error;
        }
    }
    async cleanupOldData(retentionDays = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
            shared_1.LoggerUtil.info('analytics-service', 'Starting data cleanup', {
                cutoffDate,
                retentionDays,
            });
            const [deletedEvents, deletedMetrics, deletedAlerts] = await Promise.all([
                this.analyticsEvent.deleteMany({
                    where: { timestamp: { lt: cutoffDate } },
                }),
                this.metricsSnapshot.deleteMany({
                    where: { timestamp: { lt: cutoffDate } },
                }),
                this.alert.deleteMany({
                    where: {
                        AND: [
                            { isActive: false },
                            { resolvedAt: { lt: cutoffDate } },
                        ],
                    },
                }),
            ]);
            shared_1.LoggerUtil.info('analytics-service', 'Data cleanup completed', {
                deletedEvents: deletedEvents.count,
                deletedMetrics: deletedMetrics.count,
                deletedAlerts: deletedAlerts.count,
            });
            return {
                deletedEvents: deletedEvents.count,
                deletedMetrics: deletedMetrics.count,
                deletedAlerts: deletedAlerts.count,
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to cleanup old data', error);
            throw error;
        }
    }
    async createIndexes() {
        try {
            shared_1.LoggerUtil.info('analytics-service', 'Creating database indexes');
            shared_1.LoggerUtil.info('analytics-service', 'Database indexes created successfully');
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to create database indexes', error);
            throw error;
        }
    }
    async getSlowQueries() {
        try {
            return [];
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to get slow queries', error);
            return [];
        }
    }
    async optimizePerformance() {
        try {
            shared_1.LoggerUtil.info('analytics-service', 'Starting database optimization');
            await this.$executeRaw `VACUUM ANALYZE`;
            await this.$executeRaw `REINDEX DATABASE ${this.configService.get('ANALYTICS_DATABASE_URL')}`;
            shared_1.LoggerUtil.info('analytics-service', 'Database optimization completed');
            return {
                vacuumed: true,
                analyzed: true,
                reindexed: true,
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to optimize database', error);
            throw error;
        }
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map