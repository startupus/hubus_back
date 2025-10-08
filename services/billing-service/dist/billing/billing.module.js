"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const billing_service_1 = require("./billing.service");
const pricing_service_1 = require("./pricing.service");
const payment_gateway_service_1 = require("./payment-gateway.service");
const provider_classification_service_1 = require("./provider-classification.service");
const critical_operations_service_1 = require("./critical-operations.service");
const prisma_module_1 = require("../common/prisma/prisma.module");
const cache_service_1 = require("../common/cache/cache.service");
const validation_service_1 = require("../common/validation/validation.service");
const shared_1 = require("@ai-aggregator/shared");
let BillingModule = class BillingModule {
};
exports.BillingModule = BillingModule;
exports.BillingModule = BillingModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, axios_1.HttpModule],
        providers: [
            billing_service_1.BillingService,
            pricing_service_1.PricingService,
            payment_gateway_service_1.PaymentGatewayService,
            provider_classification_service_1.ProviderClassificationService,
            critical_operations_service_1.CriticalOperationsService,
            cache_service_1.CacheService,
            validation_service_1.ValidationService,
            shared_1.RabbitMQClient
        ],
        exports: [
            billing_service_1.BillingService,
            pricing_service_1.PricingService,
            payment_gateway_service_1.PaymentGatewayService,
            provider_classification_service_1.ProviderClassificationService,
            critical_operations_service_1.CriticalOperationsService,
            cache_service_1.CacheService,
            validation_service_1.ValidationService
        ],
    })
], BillingModule);
//# sourceMappingURL=billing.module.js.map