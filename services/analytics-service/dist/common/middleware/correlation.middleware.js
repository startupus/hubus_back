"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorrelationMiddleware = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@ai-aggregator/shared");
let CorrelationMiddleware = class CorrelationMiddleware {
    use(req, res, next) {
        const generateCorrelationId = () => {
            return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        };
        const correlationId = req.headers['x-correlation-id'] ||
            req.headers['x-request-id'] ||
            generateCorrelationId();
        req['correlationId'] = correlationId;
        res.setHeader('X-Correlation-ID', correlationId);
        shared_1.LoggerUtil.info('analytics-service', `${req.method} ${req.url} - Request started`, {
            method: req.method,
            url: req.url,
            userAgent: req.headers['user-agent'],
            ip: req.ip,
        }, Array.isArray(correlationId) ? correlationId[0] : correlationId);
        res.on('finish', () => {
            shared_1.LoggerUtil.info('analytics-service', `${req.method} ${req.url} ${res.statusCode} - Request completed`, {
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
                responseTime: Date.now() - req['startTime'],
            }, Array.isArray(correlationId) ? correlationId[0] : correlationId);
        });
        req['startTime'] = Date.now();
        next();
    }
};
exports.CorrelationMiddleware = CorrelationMiddleware;
exports.CorrelationMiddleware = CorrelationMiddleware = __decorate([
    (0, common_1.Injectable)()
], CorrelationMiddleware);
//# sourceMappingURL=correlation.middleware.js.map