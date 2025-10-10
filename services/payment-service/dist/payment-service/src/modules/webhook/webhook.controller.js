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
var WebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const payment_service_1 = require("../payment/payment.service");
const yookassa_service_1 = require("../yookassa/yookassa.service");
const shared_1 = require("@ai-aggregator/shared");
let WebhookController = WebhookController_1 = class WebhookController {
    constructor(paymentService, yooKassa) {
        this.paymentService = paymentService;
        this.yooKassa = yooKassa;
        this.logger = new common_1.Logger(WebhookController_1.name);
    }
    async handleYooKassaWebhook(body, headers) {
        try {
            const { event, object } = body;
            shared_1.LoggerUtil.info('payment-service', 'YooKassa webhook received', {
                event,
                paymentId: object.id,
            });
            if (event === 'payment.succeeded') {
                const payment = await this.paymentService.getPaymentByYooKassaId(object.id);
                if (payment && payment.status === 'PENDING') {
                    await this.paymentService.processSuccessfulPayment(payment.id);
                    shared_1.LoggerUtil.info('payment-service', 'Payment processed successfully', {
                        paymentId: payment.id,
                        companyId: payment.companyId,
                    });
                }
            }
            return { status: 'ok' };
        }
        catch (error) {
            shared_1.LoggerUtil.error('payment-service', 'Webhook processing failed', error);
            throw error;
        }
    }
    verifySignature(body, signature) {
        return true;
    }
};
exports.WebhookController = WebhookController;
__decorate([
    (0, common_1.Post)('yookassa'),
    (0, swagger_1.ApiOperation)({ summary: 'Webhook от ЮKassa' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Webhook обработан' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "handleYooKassaWebhook", null);
exports.WebhookController = WebhookController = WebhookController_1 = __decorate([
    (0, swagger_1.ApiTags)('webhook'),
    (0, common_1.Controller)('v1/webhook'),
    __metadata("design:paramtypes", [payment_service_1.PaymentService,
        yookassa_service_1.YooKassaService])
], WebhookController);
//# sourceMappingURL=webhook.controller.js.map