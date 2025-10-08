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
var MonitoringMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringMiddleware = void 0;
const common_1 = require("@nestjs/common");
const api_monitor_service_1 = require("./api-monitor.service");
let MonitoringMiddleware = MonitoringMiddleware_1 = class MonitoringMiddleware {
    apiMonitor;
    logger = new common_1.Logger(MonitoringMiddleware_1.name);
    constructor(apiMonitor) {
        this.apiMonitor = apiMonitor;
    }
    use(req, res, next) {
        const startTime = Date.now();
        const originalSend = res.send;
        // Override res.send to capture response data
        res.send = function (body) {
            const responseTime = Date.now() - startTime;
            // Record metrics
            this.apiMonitor.recordMetric({
                endpoint: req.path,
                method: req.method,
                responseTime,
                statusCode: res.statusCode,
                userId: req.user?.id || req.user?.sub,
                error: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : undefined,
            });
            // Call original send
            return originalSend.call(this, body);
        };
        next();
    }
};
exports.MonitoringMiddleware = MonitoringMiddleware;
exports.MonitoringMiddleware = MonitoringMiddleware = MonitoringMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [api_monitor_service_1.ApiMonitorService])
], MonitoringMiddleware);
//# sourceMappingURL=monitoring.middleware.js.map