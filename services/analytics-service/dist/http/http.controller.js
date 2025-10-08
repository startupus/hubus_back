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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const shared_1 = require("@ai-aggregator/shared");
const analytics_service_1 = require("../services/analytics.service");
const analytics_dto_1 = require("../dto/analytics.dto");
let HttpController = class HttpController {
    analyticsService;
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    async trackEvent(data) {
        try {
            shared_1.LoggerUtil.debug('analytics-service', 'HTTP TrackEvent called', {
                userId: data.userId,
                eventName: data.eventName,
                eventType: data.eventType,
                service: data.service
            });
            if (!data.eventName || !data.eventType || !data.service) {
                throw new common_1.BadRequestException('Missing required fields: eventName, eventType, service are required');
            }
            const validEventTypes = ['user_action', 'system_event', 'ai_interaction', 'security_event'];
            if (!validEventTypes.includes(data.eventType)) {
                throw new common_1.BadRequestException(`Invalid eventType. Must be one of: ${validEventTypes.join(', ')}`);
            }
            const result = await this.analyticsService.trackEvent({
                userId: data.userId,
                eventName: data.eventName,
                eventType: data.eventType,
                service: data.service,
                properties: data.properties || {},
                metadata: data.metadata || {}
            });
            shared_1.LoggerUtil.info('analytics-service', 'Event tracked successfully', {
                eventId: result.eventId,
                eventName: data.eventName,
                userId: data.userId
            });
            return {
                success: result.success,
                message: 'Event tracked successfully',
                eventId: result.eventId,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'HTTP TrackEvent failed', error, {
                eventName: data.eventName,
                userId: data.userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException(error instanceof Error ? error.message : 'Unknown error occurred while tracking event');
        }
    }
    async getUsageMetrics(userId, startDate, endDate) {
        try {
            shared_1.LoggerUtil.debug('analytics-service', 'HTTP GetUsageMetrics called', {
                userId: userId,
                startDate: startDate,
                endDate: endDate
            });
            return await this.analyticsService.getUsageMetrics();
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'HTTP GetUsageMetrics failed', error);
            return {
                metrics: [],
            };
        }
    }
    async getDashboard() {
        try {
            shared_1.LoggerUtil.debug('analytics-service', 'HTTP GetDashboard called');
            return await this.analyticsService.getAnalyticsDashboard();
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'HTTP GetDashboard failed', error);
            throw error;
        }
    }
    async getUserAnalytics(userId) {
        try {
            shared_1.LoggerUtil.debug('analytics-service', 'HTTP GetUserAnalytics called', { userId });
            return await this.analyticsService.getUserAnalytics(userId);
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'HTTP GetUserAnalytics failed', error);
            throw error;
        }
    }
};
exports.HttpController = HttpController;
__decorate([
    (0, common_1.Post)('events/track'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Track event' }),
    (0, swagger_1.ApiBody)({ type: analytics_dto_1.TrackEventDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Event tracked successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - validation failed' }),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [analytics_dto_1.TrackEventDto]),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "trackEvent", null);
__decorate([
    (0, common_1.Get)('metrics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get usage metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Metrics retrieved successfully' }),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "getUsageMetrics", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Get analytics dashboard data' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dashboard data retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('users/:userId/analytics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user analytics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User analytics retrieved successfully' }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "getUserAnalytics", null);
exports.HttpController = HttpController = __decorate([
    (0, swagger_1.ApiTags)('analytics'),
    (0, common_1.Controller)('analytics'),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], HttpController);
//# sourceMappingURL=http.controller.js.map