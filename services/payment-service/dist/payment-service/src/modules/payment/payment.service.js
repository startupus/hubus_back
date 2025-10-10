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
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const yookassa_service_1 = require("../yookassa/yookassa.service");
const currency_service_1 = require("../currency/currency.service");
const shared_1 = require("@ai-aggregator/shared");
const library_1 = require("@prisma/client/runtime/library");
let PaymentService = class PaymentService {
    constructor(prisma, yooKassa, currency) {
        this.prisma = prisma;
        this.yooKassa = yooKassa;
        this.currency = currency;
        this.MIN_AMOUNT = 100;
    }
    async createPayment(data) {
        if (data.amount < this.MIN_AMOUNT) {
            throw new common_1.BadRequestException(`Минимальная сумма пополнения: ${this.MIN_AMOUNT} рублей`);
        }
        try {
            const exchangeRate = await this.currency.getUsdToRubRate();
            const amountUsd = await this.currency.convertRubToUsd(data.amount);
            const payment = await this.prisma.payment.create({
                data: {
                    companyId: data.companyId,
                    amount: new library_1.Decimal(data.amount),
                    amountUsd: new library_1.Decimal(amountUsd),
                    currency: 'RUB',
                    status: 'PENDING',
                    description: data.description || 'Пополнение баланса',
                    exchangeRate: new library_1.Decimal(exchangeRate),
                },
            });
            const yooKassaPayment = await this.yooKassa.createPayment({
                amount: data.amount,
                returnUrl: `${process.env.FRONTEND_URL}/payments/success`,
                companyId: data.companyId,
            });
            const updatedPayment = await this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    yookassaId: yooKassaPayment.id,
                    yookassaUrl: yooKassaPayment.confirmationUrl,
                },
            });
            shared_1.LoggerUtil.info('payment-service', 'Payment created successfully', {
                paymentId: payment.id,
                companyId: data.companyId,
                amount: data.amount,
            });
            return {
                paymentId: payment.id,
                paymentUrl: yooKassaPayment.confirmationUrl,
                amount: data.amount,
                amountUsd: amountUsd,
                status: 'PENDING',
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('payment-service', 'Failed to create payment', error);
            throw error;
        }
    }
    async getPayment(paymentId) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
        });
        if (!payment) {
            throw new common_1.NotFoundException('Платеж не найден');
        }
        return payment;
    }
    async getPaymentByYooKassaId(yooKassaId) {
        const payment = await this.prisma.payment.findFirst({
            where: { yookassaId: yooKassaId },
        });
        return payment;
    }
    async getCompanyPayments(companyId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [payments, total] = await Promise.all([
            this.prisma.payment.findMany({
                where: { companyId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.payment.count({
                where: { companyId },
            }),
        ]);
        return {
            payments,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async updatePaymentStatus(paymentId, status, yooKassaId) {
        const updateData = { status };
        if (status === 'SUCCEEDED') {
            updateData.paidAt = new Date();
        }
        if (yooKassaId) {
            updateData.yookassaId = yooKassaId;
        }
        const payment = await this.prisma.payment.update({
            where: { id: paymentId },
            data: updateData,
        });
        shared_1.LoggerUtil.info('payment-service', 'Payment status updated', {
            paymentId,
            status,
        });
        return payment;
    }
    async processSuccessfulPayment(paymentId) {
        const payment = await this.getPayment(paymentId);
        if (payment.status !== 'PENDING') {
            throw new common_1.BadRequestException('Платеж уже обработан');
        }
        await this.updatePaymentStatus(paymentId, 'SUCCEEDED');
        shared_1.LoggerUtil.info('payment-service', 'Payment processed successfully', {
            paymentId,
            companyId: payment.companyId,
            amount: payment.amount.toString(),
        });
        return payment;
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        yookassa_service_1.YooKassaService,
        currency_service_1.CurrencyService])
], PaymentService);
//# sourceMappingURL=payment.service.js.map