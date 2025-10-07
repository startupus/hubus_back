"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const axios_1 = require("@nestjs/axios");
const health_module_1 = require("./health/health.module");
const auth_module_1 = require("./auth/auth.module");
const chat_module_1 = require("./chat/chat.module");
const billing_module_1 = require("./billing/billing.module");
const analytics_module_1 = require("./analytics/analytics.module");
const ai_certification_module_1 = require("./ai-certification/ai-certification.module");
const orchestrator_module_1 = require("./orchestrator/orchestrator.module");
const proxy_module_1 = require("./proxy/proxy.module");
const history_module_1 = require("./history/history.module");
const prisma_module_1 = require("./prisma/prisma.module");
const fsb_module_1 = require("./fsb/fsb.module");
const anonymization_module_1 = require("./anonymization/anonymization.module");
const configuration_1 = require("./config/configuration");
const validation_schema_1 = require("./config/validation.schema");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [configuration_1.configuration],
                validationSchema: validation_schema_1.validationSchema,
                envFilePath: ['.env.local', '.env'],
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 100,
                },
            ]),
            axios_1.HttpModule.register({
                timeout: 10000,
                maxRedirects: 3,
            }),
            health_module_1.HealthModule,
            auth_module_1.AuthModule,
            chat_module_1.ChatModule,
            billing_module_1.BillingModule,
            analytics_module_1.AnalyticsModule,
            ai_certification_module_1.AICertificationModule,
            orchestrator_module_1.OrchestratorModule,
            proxy_module_1.ProxyModule,
            history_module_1.HistoryModule,
            prisma_module_1.PrismaModule,
            fsb_module_1.FsbModule,
            anonymization_module_1.AnonymizationModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map