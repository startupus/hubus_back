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
exports.BillingClient = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
let BillingClient = class BillingClient {
    constructor() {
        this.BILLING_SERVICE_URL = process.env.BILLING_SERVICE_URL || 'http://billing-service:3004';
        this.axiosInstance = axios_1.default.create({
            timeout: 10000,
            maxRedirects: 3,
        });
    }
    async getBalance(data, accessToken) {
        const response = await this.axiosInstance.get(`${this.BILLING_SERVICE_URL}/billing/balance/${data.userId}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        return response.data;
    }
    async createTransaction(data, accessToken) {
        const response = await this.axiosInstance.post(`${this.BILLING_SERVICE_URL}/billing/transaction`, data, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        return response.data;
    }
    async getTransactionHistory(data, accessToken) {
        const response = await this.axiosInstance.get(`${this.BILLING_SERVICE_URL}/billing/transactions/${data.userId}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { limit: data.limit, offset: data.offset }
        });
        return response.data;
    }
    async calculateCost(data, accessToken) {
        const response = await this.axiosInstance.post(`${this.BILLING_SERVICE_URL}/billing/calculate-cost`, data, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        return response.data;
    }
};
exports.BillingClient = BillingClient;
exports.BillingClient = BillingClient = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], BillingClient);
//# sourceMappingURL=billing.client.js.map