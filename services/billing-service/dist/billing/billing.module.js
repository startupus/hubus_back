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
const billing_controller_1 = require("./billing.controller");
const billing_service_1 = require("./billing.service");
const pricing_service_1 = require("./pricing.service");
const payment_gateway_service_1 = require("./payment-gateway.service");
const provider_classification_service_1 = require("./provider-classification.service");
const critical_operations_service_1 = require("./critical-operations.service");
const referral_service_1 = require("./referral.service");
const subscription_service_1 = require("./subscription.service");
const prisma_module_1 = require("../common/prisma/prisma.module");
const cache_service_1 = require("../common/cache/cache.service");
const redis_cache_service_1 = require("../common/cache/redis-cache.service");
const connection_pool_service_1 = require("../common/database/connection-pool.service");
const validation_service_1 = require("../common/validation/validation.service");
const rabbitmq_module_1 = require("../common/rabbitmq/rabbitmq.module");
let BillingModule = class BillingModule {
};
exports.BillingModule = BillingModule;
exports.BillingModule = BillingModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, rabbitmq_module_1.RabbitMQModule],
        controllers: [billing_controller_1.BillingController],
        providers: [
            billing_service_1.BillingService,
            pricing_service_1.PricingService,
            payment_gateway_service_1.PaymentGatewayService,
            provider_classification_service_1.ProviderClassificationService,
            critical_operations_service_1.CriticalOperationsService,
            referral_service_1.ReferralService,
            subscription_service_1.SubscriptionService,
            cache_service_1.CacheService,
            redis_cache_service_1.RedisCacheService,
            connection_pool_service_1.ConnectionPoolService,
            validation_service_1.ValidationService
        ],
        exports: [
            billing_service_1.BillingService,
            pricing_service_1.PricingService,
            payment_gateway_service_1.PaymentGatewayService,
            provider_classification_service_1.ProviderClassificationService,
            critical_operations_service_1.CriticalOperationsService,
            referral_service_1.ReferralService,
            subscription_service_1.SubscriptionService,
            cache_service_1.CacheService,
            redis_cache_service_1.RedisCacheService,
            connection_pool_service_1.ConnectionPoolService,
            validation_service_1.ValidationService
        ],
    })
], BillingModule);
//# sourceMappingURL=billing.module.js.map