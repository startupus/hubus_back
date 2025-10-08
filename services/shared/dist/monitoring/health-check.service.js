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
var HealthCheckService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthCheckService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const logger_util_1 = require("../utils/logger.util");
let HealthCheckService = HealthCheckService_1 = class HealthCheckService {
    configService;
    logger = new common_1.Logger(HealthCheckService_1.name);
    startTime = Date.now();
    constructor(configService) {
        this.configService = configService;
    }
    /**
     * Perform comprehensive health check
     */
    async performHealthCheck(serviceName) {
        const startTime = Date.now();
        const details = {};
        let status = 'healthy';
        let error;
        try {
            // Check database connection
            try {
                details.database = await this.checkDatabase();
            }
            catch (err) {
                details.database = false;
                status = 'unhealthy';
                error = `Database check failed: ${err}`;
            }
            // Check Redis connection
            try {
                details.redis = await this.checkRedis();
            }
            catch (err) {
                details.redis = false;
                if (status === 'healthy')
                    status = 'degraded';
                if (!error)
                    error = `Redis check failed: ${err}`;
            }
            // Check RabbitMQ connection
            try {
                details.rabbitmq = await this.checkRabbitMQ();
            }
            catch (err) {
                details.rabbitmq = false;
                if (status === 'healthy')
                    status = 'degraded';
                if (!error)
                    error = `RabbitMQ check failed: ${err}`;
            }
            // Get memory usage
            details.memory = process.memoryUsage();
            // Get uptime
            details.uptime = Date.now() - this.startTime;
            // Check memory usage
            const memoryUsageMB = details.memory.heapUsed / 1024 / 1024;
            if (memoryUsageMB > 1000) { // More than 1GB
                if (status === 'healthy')
                    status = 'degraded';
                if (!error)
                    error = 'High memory usage detected';
            }
        }
        catch (err) {
            status = 'unhealthy';
            error = `Health check failed: ${err}`;
        }
        const responseTime = Date.now() - startTime;
        const result = {
            service: serviceName,
            status,
            responseTime,
            timestamp: new Date(),
            details,
            error,
        };
        // Log health check result
        if (status === 'unhealthy') {
            logger_util_1.LoggerUtil.error('health-check', 'Service is unhealthy', {
                service: serviceName,
                status,
                error,
                details,
            });
        }
        else if (status === 'degraded') {
            logger_util_1.LoggerUtil.warn('health-check', 'Service is degraded', {
                service: serviceName,
                status,
                error,
                details,
            });
        }
        else {
            logger_util_1.LoggerUtil.info('health-check', 'Service is healthy', {
                service: serviceName,
                status,
                responseTime,
                details,
            });
        }
        return result;
    }
    /**
     * Check database connection
     */
    async checkDatabase() {
        // This would be implemented based on your database setup
        // For now, return true as a placeholder
        return true;
    }
    /**
     * Check Redis connection
     */
    async checkRedis() {
        try {
            const redisUrl = this.configService.get('REDIS_URL');
            if (!redisUrl) {
                throw new Error('REDIS_URL not configured');
            }
            // This would be implemented with actual Redis client
            // For now, return true as a placeholder
            return true;
        }
        catch (err) {
            throw new Error(`Redis check failed: ${err}`);
        }
    }
    /**
     * Check RabbitMQ connection
     */
    async checkRabbitMQ() {
        try {
            const rabbitmqUrl = this.configService.get('RABBITMQ_URL');
            if (!rabbitmqUrl) {
                throw new Error('RABBITMQ_URL not configured');
            }
            // This would be implemented with actual RabbitMQ client
            // For now, return true as a placeholder
            return true;
        }
        catch (err) {
            throw new Error(`RabbitMQ check failed: ${err}`);
        }
    }
    /**
     * Get system metrics
     */
    getSystemMetrics() {
        return {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            platform: process.platform,
            nodeVersion: process.version,
        };
    }
    /**
     * Check if system resources are healthy
     */
    checkSystemResources() {
        const memory = process.memoryUsage();
        const memoryUsageMB = memory.heapUsed / 1024 / 1024;
        let memoryStatus = 'healthy';
        if (memoryUsageMB > 2000) {
            memoryStatus = 'unhealthy';
        }
        else if (memoryUsageMB > 1000) {
            memoryStatus = 'degraded';
        }
        // CPU check would require more sophisticated monitoring
        const cpuStatus = 'healthy';
        // Determine overall status
        let overall = 'healthy';
        const memStatus = memoryStatus;
        const cpStatus = cpuStatus;
        if (memStatus === 'unhealthy' || cpStatus === 'unhealthy') {
            overall = 'unhealthy';
        }
        else if (memStatus === 'degraded' || cpStatus === 'degraded') {
            overall = 'degraded';
        }
        return {
            memory: memoryStatus,
            cpu: cpuStatus,
            overall,
        };
    }
};
exports.HealthCheckService = HealthCheckService;
exports.HealthCheckService = HealthCheckService = HealthCheckService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], HealthCheckService);
//# sourceMappingURL=health-check.service.js.map