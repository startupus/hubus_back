"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitMQModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const payment_consumer_service_1 = require("./payment-consumer.service");
const billing_module_1 = require("../billing/billing.module");
const security_module_1 = require("../security/security.module");
let RabbitMQModule = class RabbitMQModule {
};
exports.RabbitMQModule = RabbitMQModule;
exports.RabbitMQModule = RabbitMQModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, billing_module_1.BillingModule, security_module_1.SecurityModule],
        providers: [payment_consumer_service_1.PaymentConsumerService],
        exports: [payment_consumer_service_1.PaymentConsumerService],
    })
], RabbitMQModule);
//# sourceMappingURL=rabbitmq.module.js.map