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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
let AnalyticsService = class AnalyticsService {
    httpService;
    configService;
    analyticsServiceUrl;
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        this.analyticsServiceUrl = this.configService.get('ANALYTICS_SERVICE_URL', 'http://analytics-service:3005');
    }
    async getMetrics() {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.analyticsServiceUrl}/analytics/metrics`));
            return response.data;
        }
        catch (error) {
            throw new common_1.HttpException('Failed to get analytics metrics', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getDashboard() {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.analyticsServiceUrl}/analytics/dashboard`));
            return response.data;
        }
        catch (error) {
            throw new common_1.HttpException('Failed to get analytics dashboard', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getCollectionStats() {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.analyticsServiceUrl}/analytics/stats/collection`));
            return response.data;
        }
        catch (error) {
            throw new common_1.HttpException('Failed to get collection statistics', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getEventsSummary() {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.analyticsServiceUrl}/analytics/events/summary`));
            return response.data;
        }
        catch (error) {
            throw new common_1.HttpException('Failed to get events summary', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async trackEvent(eventData) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.analyticsServiceUrl}/analytics/track-event`, eventData));
            return response.data;
        }
        catch (error) {
            throw new common_1.HttpException('Failed to track event', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async trackEventAlternative(eventData) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.analyticsServiceUrl}/analytics/events/track`, eventData));
            return response.data;
        }
        catch (error) {
            throw new common_1.HttpException('Failed to track event (alternative)', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map