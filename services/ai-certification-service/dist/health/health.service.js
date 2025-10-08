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
let HealthService = class HealthService {
    constructor() {
        this.startTime = Date.now();
    }
    getHealth() {
        const uptime = Date.now() - this.startTime;
        return {
            service: 'ai-certification-service',
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            uptime,
            dependencies: {
                database: { status: 'healthy', responseTime: 0 },
                redis: { status: 'healthy', responseTime: 0 },
                rabbitmq: { status: 'healthy', responseTime: 0 },
            },
        };
    }
    getReadiness() {
        return {
            service: 'ai-certification-service',
            status: 'ready',
            timestamp: new Date().toISOString(),
        };
    }
    getLiveness() {
        return {
            service: 'ai-certification-service',
            status: 'alive',
            timestamp: new Date().toISOString(),
        };
    }
};
exports.HealthService = HealthService;
exports.HealthService = HealthService = __decorate([
    (0, common_1.Injectable)()
], HealthService);
//# sourceMappingURL=health.service.js.map