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
exports.HealthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const shared_1 = require("@ai-aggregator/shared");
let HealthService = class HealthService {
    configService;
    startTime = Date.now();
    constructor(configService) {
        this.configService = configService;
    }
    async getHealth() {
        const service = this.configService.get('service.name', 'api-gateway');
        const version = this.configService.get('service.version', '1.0.0');
        const uptime = Date.now() - this.startTime;
        const dependencies = {
            redis: await this.checkRedis(),
            rabbitmq: await this.checkRabbitMQ(),
        };
        const isHealthy = Object.values(dependencies).every(dep => dep.status === 'healthy');
        const status = isHealthy ? 'healthy' : 'unhealthy';
        shared_1.LoggerUtil.info(service, 'Health check performed', {
            status,
            uptime,
            dependencies,
        });
        return {
            service,
            status,
            timestamp: new Date(),
            version,
            uptime,
            dependencies,
        };
    }
    async getReadiness() {
        const health = await this.getHealth();
        const isReady = health.status === 'healthy';
        return {
            status: isReady ? 'ready' : 'not ready',
            timestamp: new Date().toISOString(),
        };
    }
    async getLiveness() {
        return {
            status: 'alive',
            timestamp: new Date().toISOString(),
        };
    }
    async checkRedis() {
        const start = Date.now();
        try {
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
    async checkRabbitMQ() {
        const start = Date.now();
        try {
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
exports.HealthService = HealthService;
exports.HealthService = HealthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], HealthService);
//# sourceMappingURL=health.service.js.map