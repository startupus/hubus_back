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
var YooKassaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.YooKassaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const shared_1 = require("@ai-aggregator/shared");
let YooKassaService = YooKassaService_1 = class YooKassaService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(YooKassaService_1.name);
    }
    async createPayment(data) {
        const paymentId = `stub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        shared_1.LoggerUtil.info('payment-service', 'YooKassa payment creation (stub)', {
            companyId: data.companyId,
            amount: data.amount,
            paymentId
        });
        return {
            id: paymentId,
            status: 'pending',
            confirmationUrl: `${data.returnUrl}?payment_id=${paymentId}&amount=${data.amount}`,
            amount: data.amount.toString(),
            currency: 'RUB'
        };
    }
    async processWebhook(webhookData) {
        shared_1.LoggerUtil.info('payment-service', 'YooKassa webhook processing (stub)', {
            webhookData
        });
        const paymentId = webhookData?.object?.id || 'stub-payment-id';
        return {
            success: true,
            paymentId: paymentId,
            status: 'succeeded',
            amount: webhookData?.object?.amount?.value || '0',
            currency: webhookData?.object?.amount?.currency || 'RUB'
        };
    }
};
exports.YooKassaService = YooKassaService;
exports.YooKassaService = YooKassaService = YooKassaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], YooKassaService);
//# sourceMappingURL=yookassa.service.js.map