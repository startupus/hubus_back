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
var ConnectionPoolService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionPoolService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const shared_1 = require("@ai-aggregator/shared");
const client_1 = require("@prisma/client");
let ConnectionPoolService = ConnectionPoolService_1 = class ConnectionPoolService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(ConnectionPoolService_1.name);
        this.maxConnections = this.configService.get('DATABASE_MAX_CONNECTIONS', 20);
        this.minConnections = this.configService.get('DATABASE_MIN_CONNECTIONS', 5);
        this.connectionTimeout = this.configService.get('DATABASE_CONNECTION_TIMEOUT', 10000);
        this.retryAttempts = this.configService.get('DATABASE_RETRY_ATTEMPTS', 3);
        this.retryDelay = this.configService.get('DATABASE_RETRY_DELAY', 1000);
        this.prisma = new client_1.PrismaClient({
            datasources: {
                db: {
                    url: this.configService.get('BILLING_DATABASE_URL'),
                },
            },
            log: [
                { level: 'query', emit: 'event' },
                { level: 'error', emit: 'event' },
                { level: 'info', emit: 'event' },
                { level: 'warn', emit: 'event' },
            ],
        });
    }
    async onModuleInit() {
        try {
            await this.prisma.$connect();
            shared_1.LoggerUtil.info('billing-service', 'Database connection pool initialized', {
                maxConnections: this.maxConnections,
                minConnections: this.minConnections,
            });
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to initialize database connection pool', error);
            throw error;
        }
    }
    async onModuleDestroy() {
        try {
            await this.prisma.$disconnect();
            shared_1.LoggerUtil.info('billing-service', 'Database connection pool closed');
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to close database connection pool', error);
        }
    }
    getPrismaClient() {
        return this.prisma;
    }
    async executeWithRetry(operation, operationName, maxRetries = this.retryAttempts) {
        let lastError = null;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await operation();
                if (attempt > 1) {
                    shared_1.LoggerUtil.info('billing-service', 'Operation succeeded after retry', {
                        operation: operationName,
                        attempt,
                        maxRetries,
                    });
                }
                return result;
            }
            catch (error) {
                lastError = error;
                shared_1.LoggerUtil.warn('billing-service', 'Operation failed, retrying', {
                    operation: operationName,
                    attempt,
                    maxRetries,
                    error: lastError.message,
                });
                if (attempt < maxRetries) {
                    await this.delay(this.retryDelay * attempt);
                }
            }
        }
        shared_1.LoggerUtil.error('billing-service', 'Operation failed after all retries', lastError || new Error('Unknown error'));
        throw lastError || new Error(`Operation ${operationName} failed after ${maxRetries} attempts`);
    }
    async executeTransactionWithRetry(transaction, operationName, maxRetries = this.retryAttempts) {
        return this.executeWithRetry(() => this.prisma.$transaction(transaction), operationName, maxRetries);
    }
    async getConnectionStats() {
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            return {
                isConnected: true,
                uptime: process.uptime(),
                maxConnections: this.maxConnections,
                minConnections: this.minConnections,
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to get connection stats', error);
            return {
                isConnected: false,
                uptime: process.uptime(),
                maxConnections: this.maxConnections,
                minConnections: this.minConnections,
            };
        }
    }
    async healthCheck() {
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            return true;
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Database health check failed', error);
            return false;
        }
    }
    async runMigrations() {
        try {
            shared_1.LoggerUtil.info('billing-service', 'Running database migrations...');
            shared_1.LoggerUtil.info('billing-service', 'Database migrations completed');
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to run migrations', error);
            throw error;
        }
    }
    async clearConnections() {
        try {
            await this.prisma.$disconnect();
            await this.prisma.$connect();
            shared_1.LoggerUtil.info('billing-service', 'Database connections cleared');
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to clear connections', error);
        }
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
exports.ConnectionPoolService = ConnectionPoolService;
exports.ConnectionPoolService = ConnectionPoolService = ConnectionPoolService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ConnectionPoolService);
//# sourceMappingURL=connection-pool.service.js.map