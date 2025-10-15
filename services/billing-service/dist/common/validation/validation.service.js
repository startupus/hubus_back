"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ValidationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@ai-aggregator/shared");
const billing_exceptions_1 = require("../../exceptions/billing.exceptions");
let ValidationService = ValidationService_1 = class ValidationService {
    constructor() {
        this.logger = new common_1.Logger(ValidationService_1.name);
        this.supportedCurrencies = ['USD', 'EUR', 'RUB', 'BTC', 'ETH'];
        this.minAmount = 0.001;
        this.maxAmount = 1000000;
    }
    validateAmount(amount, currency = 'USD') {
        if (!amount || amount <= 0) {
            throw new billing_exceptions_1.InvalidAmountException(amount);
        }
        if (amount < this.minAmount) {
            throw new billing_exceptions_1.InvalidAmountException(amount);
        }
        if (amount > this.maxAmount) {
            throw new billing_exceptions_1.InvalidAmountException(amount);
        }
        const decimalPlaces = (amount.toString().split('.')[1] || '').length;
        if (decimalPlaces > 4) {
            throw new billing_exceptions_1.InvalidAmountException(amount);
        }
    }
    validateCurrency(currency) {
        if (!currency || !this.supportedCurrencies.includes(currency.toUpperCase())) {
            throw new billing_exceptions_1.InvalidCurrencyException(currency);
        }
    }
    async validateCompany(companyId, prisma) {
        if (!companyId || typeof companyId !== 'string') {
            throw new billing_exceptions_1.CompanyNotFoundException(companyId);
        }
        try {
            const company = await prisma.company.findUnique({
                where: { id: companyId },
                select: { id: true, isActive: true }
            });
            if (!company) {
                throw new billing_exceptions_1.CompanyNotFoundException(companyId);
            }
            if (!company.isActive) {
                throw new billing_exceptions_1.CompanyNotFoundException(companyId);
            }
        }
        catch (error) {
            if (error instanceof billing_exceptions_1.CompanyNotFoundException) {
                throw error;
            }
            shared_1.LoggerUtil.error('billing-service', 'Company validation error', error, { companyId });
            throw new billing_exceptions_1.CompanyNotFoundException(companyId);
        }
    }
    async validatePaymentMethod(paymentMethodId, companyId, prisma) {
        if (!paymentMethodId) {
            return;
        }
        try {
            const paymentMethod = await prisma.paymentMethod.findFirst({
                where: {
                    id: paymentMethodId,
                    companyId: companyId
                },
                select: { id: true, isActive: true }
            });
            if (!paymentMethod) {
                throw new billing_exceptions_1.PaymentMethodNotFoundException(paymentMethodId);
            }
        }
        catch (error) {
            if (error instanceof billing_exceptions_1.PaymentMethodNotFoundException) {
                throw error;
            }
            shared_1.LoggerUtil.error('billing-service', 'Payment method validation error', error, { paymentMethodId, companyId });
            throw new billing_exceptions_1.PaymentMethodNotFoundException(paymentMethodId);
        }
    }
    validateBalanceForOperation(currentBalance, amount, operation, creditLimit) {
        const balance = currentBalance.toNumber();
        const credit = creditLimit?.toNumber() || 0;
        if (operation === 'subtract') {
            const newBalance = balance - amount;
            const minBalance = -credit;
            if (newBalance < minBalance) {
                throw new billing_exceptions_1.InsufficientBalanceException(amount, balance, 'USD');
            }
        }
        if (operation === 'add' && amount <= 0) {
            throw new billing_exceptions_1.InvalidAmountException(amount);
        }
    }
    validateTransaction(type, amount, currency, companyId) {
        this.validateAmount(amount, currency);
        this.validateCurrency(currency);
        if (!companyId || typeof companyId !== 'string') {
            throw new Error('Invalid company ID');
        }
        const validTypes = ['CREDIT', 'DEBIT', 'REFUND', 'CHARGEBACK'];
        if (!validTypes.includes(type)) {
            throw new Error(`Invalid transaction type: ${type}`);
        }
    }
    validateUsage(service, resource, quantity) {
        if (!service || typeof service !== 'string') {
            throw new Error('Invalid service');
        }
        if (!resource || typeof resource !== 'string') {
            throw new Error('Invalid resource');
        }
        if (!quantity || quantity <= 0 || quantity > 10000) {
            throw new Error('Invalid quantity');
        }
    }
    validateReportPeriod(startDate, endDate) {
        if (!startDate || !endDate) {
            throw new Error('Invalid date range');
        }
        if (startDate >= endDate) {
            throw new Error('Start date must be before end date');
        }
        const maxPeriod = 365 * 24 * 60 * 60 * 1000;
        if (endDate.getTime() - startDate.getTime() > maxPeriod) {
            throw new Error('Report period too long');
        }
    }
    validateMetadata(metadata) {
        if (metadata && typeof metadata !== 'object') {
            throw new Error('Invalid metadata format');
        }
        if (metadata && Object.keys(metadata).length > 50) {
            throw new Error('Too many metadata fields');
        }
        if (metadata && JSON.stringify(metadata).length > 10000) {
            throw new Error('Metadata too large');
        }
    }
    validateId(id, fieldName = 'ID') {
        if (!id || typeof id !== 'string') {
            throw new Error(`Invalid ${fieldName}`);
        }
        if (id.length < 1 || id.length > 100) {
            throw new Error(`Invalid ${fieldName} length`);
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(id) && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
            throw new Error(`Invalid ${fieldName} format`);
        }
    }
    validateEmail(email) {
        if (!email || typeof email !== 'string') {
            throw new Error('Invalid email');
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format');
        }
    }
    validatePhone(phone) {
        if (!phone || typeof phone !== 'string') {
            throw new Error('Invalid phone');
        }
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test(phone)) {
            throw new Error('Invalid phone format');
        }
    }
    validateIP(ip) {
        if (!ip || typeof ip !== 'string') {
            throw new Error('Invalid IP');
        }
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
            throw new Error('Invalid IP format');
        }
    }
};
exports.ValidationService = ValidationService;
exports.ValidationService = ValidationService = ValidationService_1 = __decorate([
    (0, common_1.Injectable)()
], ValidationService);
//# sourceMappingURL=validation.service.js.map