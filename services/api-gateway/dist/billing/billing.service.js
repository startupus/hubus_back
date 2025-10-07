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
exports.BillingService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
let BillingService = class BillingService {
    httpService;
    configService;
    billingServiceUrl;
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        this.billingServiceUrl = this.configService.get('BILLING_SERVICE_URL', 'http://billing-service:3004');
    }
    async getBalance(userId) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.billingServiceUrl}/billing/balance/${userId}`));
            return response.data;
        }
        catch (error) {
            if (error.response?.status === 404) {
                throw new common_1.HttpException('User balance not found', common_1.HttpStatus.NOT_FOUND);
            }
            throw new common_1.HttpException('Failed to get balance', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async trackUsage(data) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.billingServiceUrl}/billing/usage/track`, data));
            return response.data;
        }
        catch (error) {
            throw new common_1.HttpException('Failed to track usage', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getReport(userId) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.billingServiceUrl}/billing/report/${userId}`));
            return response.data;
        }
        catch (error) {
            throw new common_1.HttpException('Failed to get billing report', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async createTransaction(data) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.billingServiceUrl}/billing/transaction`, data));
            return response.data;
        }
        catch (error) {
            throw new common_1.HttpException('Failed to create transaction', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getTransactions(userId) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.billingServiceUrl}/billing/transactions/${userId}`));
            return response.data;
        }
        catch (error) {
            throw new common_1.HttpException('Failed to get transactions', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async processPayment(data) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.billingServiceUrl}/billing/payment/process`, data));
            return response.data;
        }
        catch (error) {
            throw new common_1.HttpException('Failed to process payment', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async refundPayment(data) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.billingServiceUrl}/billing/payment/refund`, data));
            return response.data;
        }
        catch (error) {
            throw new common_1.HttpException('Failed to refund payment', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], BillingService);
//# sourceMappingURL=billing.service.js.map