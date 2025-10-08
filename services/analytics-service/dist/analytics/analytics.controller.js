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
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const shared_1 = require("@ai-aggregator/shared");
let AnalyticsController = class AnalyticsController {
    constructor() { }
    async trackEvent(body) {
        try {
            shared_1.LoggerUtil.debug('analytics-service', 'HTTP TrackEvent called', {
                userId: body.userId,
                eventName: body.eventName
            });
            return {
                success: true,
                message: 'Event tracked successfully',
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'HTTP TrackEvent failed', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async trackEventAlternative(body) {
        try {
            shared_1.LoggerUtil.debug('analytics-service', 'HTTP TrackEventAlternative called', {
                userId: body.userId,
                eventType: body.eventType
            });
            return {
                success: true,
                message: 'Event tracked successfully',
                eventId: `event-${Date.now()}`,
                eventType: body.eventType
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'HTTP TrackEventAlternative failed', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async trackEventStandard(body) {
        try {
            shared_1.LoggerUtil.debug('analytics-service', 'HTTP TrackEventStandard called', {
                userId: body.userId,
                eventName: body.eventName,
                service: body.service
            });
            return {
                success: true,
                message: 'Event tracked successfully',
                eventId: `event-${Date.now()}`,
                eventName: body.eventName,
                service: body.service
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'HTTP TrackEventStandard failed', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async getUsageMetrics(userId, startDate, endDate) {
        try {
            shared_1.LoggerUtil.debug('analytics-service', 'HTTP GetUsageMetrics called', {
                userId,
                startDate,
                endDate
            });
            return {
                metrics: [
                    {
                        name: 'requests_count',
                        value: 100,
                        unit: 'count',
                        timestamp: new Date().toISOString(),
                    },
                    {
                        name: 'tokens_used',
                        value: 5000,
                        unit: 'tokens',
                        timestamp: new Date().toISOString(),
                    },
                    {
                        name: 'total_cost',
                        value: 25.50,
                        unit: 'USD',
                        timestamp: new Date().toISOString(),
                    },
                    {
                        name: 'average_response_time',
                        value: 1.2,
                        unit: 'seconds',
                        timestamp: new Date().toISOString(),
                    },
                ],
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'HTTP GetUsageMetrics failed', error);
            return {
                metrics: [],
            };
        }
    }
    async getDashboard(userId) {
        try {
            shared_1.LoggerUtil.debug('analytics-service', 'HTTP GetDashboard called', { userId });
            return {
                summary: {
                    total_requests: 1250,
                    total_tokens: 45000,
                    total_cost: 125.75,
                    average_response_time: 1.5,
                    success_rate: 98.5,
                },
                recent_activity: [
                    {
                        timestamp: new Date().toISOString(),
                        event: 'api_request',
                        details: 'GPT-4 completion request',
                        cost: 0.05,
                    },
                    {
                        timestamp: new Date(Date.now() - 300000).toISOString(),
                        event: 'api_request',
                        details: 'GPT-3.5-turbo completion request',
                        cost: 0.02,
                    },
                ],
                top_models: [
                    { model: 'gpt-4', requests: 800, cost: 100.50 },
                    { model: 'gpt-3.5-turbo', requests: 450, cost: 25.25 },
                ],
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'HTTP GetDashboard failed', error);
            throw error;
        }
    }
    async getPing() {
        return {
            service: 'analytics-service',
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
        };
    }
    async getCollectionStats() {
        try {
            shared_1.LoggerUtil.debug('analytics-service', 'HTTP GetCollectionStats called');
            return {
                success: true,
                data: {
                    totalEvents: 15000,
                    totalUsers: 250,
                    totalSessions: 500,
                    averageEventsPerUser: 60,
                    topEvents: [
                        { name: 'api_request', count: 8000 },
                        { name: 'user_login', count: 3000 },
                        { name: 'model_usage', count: 2500 },
                        { name: 'error_occurred', count: 1000 },
                        { name: 'payment_processed', count: 500 }
                    ],
                    recentActivity: [
                        {
                            timestamp: new Date().toISOString(),
                            event: 'api_request',
                            userId: 'user-123',
                            service: 'openai',
                            cost: 0.05
                        },
                        {
                            timestamp: new Date(Date.now() - 300000).toISOString(),
                            event: 'user_login',
                            userId: 'user-456',
                            service: 'auth',
                            cost: 0.00
                        }
                    ]
                }
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'HTTP GetCollectionStats failed', error);
            return {
                success: false,
                data: null,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async getEventsSummary(startDate, endDate, userId) {
        try {
            shared_1.LoggerUtil.debug('analytics-service', 'HTTP GetEventsSummary called', {
                startDate,
                endDate,
                userId
            });
            return {
                success: true,
                data: {
                    period: {
                        start: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                        end: endDate || new Date().toISOString()
                    },
                    summary: {
                        totalEvents: 2500,
                        uniqueUsers: 45,
                        totalSessions: 120,
                        averageEventsPerSession: 20.8
                    },
                    breakdown: {
                        byEventType: {
                            'user_action': 800,
                            'system_event': 600,
                            'ai_interaction': 700,
                            'security_event': 200,
                            'billing_event': 200
                        },
                        byService: {
                            'auth-service': 400,
                            'api-gateway': 800,
                            'proxy-service': 600,
                            'billing-service': 200,
                            'analytics-service': 300
                        },
                        byHour: Array.from({ length: 24 }, (_, i) => ({
                            hour: i,
                            events: Math.floor(Math.random() * 100) + 50
                        }))
                    }
                }
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'HTTP GetEventsSummary failed', error);
            return {
                success: false,
                data: null,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Post)('track-event'),
    (0, swagger_1.ApiOperation)({ summary: 'Track analytics event' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Event tracked successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "trackEvent", null);
__decorate([
    (0, common_1.Post)('events/track'),
    (0, swagger_1.ApiOperation)({ summary: 'Track analytics event (alternative endpoint)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Event tracked successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "trackEventAlternative", null);
__decorate([
    (0, common_1.Post)('track-event'),
    (0, swagger_1.ApiOperation)({ summary: 'Track analytics event (standard format)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Event tracked successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "trackEventStandard", null);
__decorate([
    (0, common_1.Get)('usage-metrics/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get usage metrics for user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Usage metrics retrieved successfully' }),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getUsageMetrics", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Get analytics dashboard data' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dashboard data retrieved successfully' }),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('ping'),
    (0, swagger_1.ApiOperation)({ summary: 'Ping check for analytics service' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service is healthy' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getPing", null);
__decorate([
    (0, common_1.Get)('stats/collection'),
    (0, swagger_1.ApiOperation)({ summary: 'Get analytics collection stats' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Collection stats retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getCollectionStats", null);
__decorate([
    (0, common_1.Get)('events/summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Get events summary' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Events summary retrieved successfully' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getEventsSummary", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, swagger_1.ApiTags)('Analytics'),
    (0, common_1.Controller)('analytics'),
    __metadata("design:paramtypes", [])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map