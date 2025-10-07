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
const analytics_service_1 = require("./analytics.service");
let AnalyticsController = class AnalyticsController {
    analyticsService;
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    async getMetrics() {
        return this.analyticsService.getMetrics();
    }
    async getDashboard() {
        return this.analyticsService.getDashboard();
    }
    async getCollectionStats() {
        return this.analyticsService.getCollectionStats();
    }
    async getEventsSummary() {
        return this.analyticsService.getEventsSummary();
    }
    async trackEvent(eventData) {
        return this.analyticsService.trackEvent(eventData);
    }
    async trackEventAlternative(eventData) {
        return this.analyticsService.trackEventAlternative(eventData);
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('metrics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get analytics metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Analytics metrics retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Get analytics dashboard' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Analytics dashboard retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('stats/collection'),
    (0, swagger_1.ApiOperation)({ summary: 'Get collection statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Collection statistics retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getCollectionStats", null);
__decorate([
    (0, common_1.Get)('events/summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Get events summary' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Events summary retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getEventsSummary", null);
__decorate([
    (0, common_1.Post)('events/track'),
    (0, swagger_1.ApiOperation)({ summary: 'Track an event' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Event tracked successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "trackEvent", null);
__decorate([
    (0, common_1.Post)('track-event'),
    (0, swagger_1.ApiOperation)({ summary: 'Track an event (alternative format)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Event tracked successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "trackEventAlternative", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, swagger_1.ApiTags)('Analytics'),
    (0, common_1.Controller)('analytics'),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map