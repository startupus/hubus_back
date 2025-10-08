"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@ai-aggregator/shared");
let HealthService = class HealthService {
    async getHealth() {
        shared_1.LoggerUtil.info('analytics-service', 'HealthService.getHealth() called');
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'analytics-service',
            version: '1.0.0',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            database: {
                status: 'healthy',
                responseTime: '5ms',
                timestamp: new Date().toISOString(),
            },
        };
    }
    async getReadiness() {
        return {
            status: 'ready',
            timestamp: new Date().toISOString(),
            checks: {
                database: {
                    status: 'healthy',
                    responseTime: '5ms',
                    timestamp: new Date().toISOString(),
                },
                service: 'healthy',
            },
        };
    }
    async getLiveness() {
        return {
            status: 'alive',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        };
    }
};
exports.HealthService = HealthService;
exports.HealthService = HealthService = __decorate([
    (0, common_1.Injectable)()
], HealthService);
//# sourceMappingURL=health.service.js.map