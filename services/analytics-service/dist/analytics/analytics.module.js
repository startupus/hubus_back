"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const prisma_service_1 = require("../common/prisma/prisma.service");
const data_collection_service_1 = require("../services/data-collection.service");
const analytics_service_1 = require("../services/analytics.service");
const reporting_service_1 = require("../services/reporting.service");
const prometheus_service_1 = require("../integrations/prometheus.service");
const grafana_service_1 = require("../integrations/grafana.service");
const webhook_service_1 = require("../integrations/webhook.service");
const neural_network_recommendation_service_1 = require("./neural-network-recommendation.service");
const neural_network_recommendation_controller_1 = require("./neural-network-recommendation.controller");
const http_controller_1 = require("../http/http.controller");
const reporting_controller_1 = require("../controllers/reporting.controller");
let AnalyticsModule = class AnalyticsModule {
};
exports.AnalyticsModule = AnalyticsModule;
exports.AnalyticsModule = AnalyticsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            axios_1.HttpModule.register({
                timeout: 10000,
                maxRedirects: 3,
            }),
        ],
        controllers: [
            http_controller_1.HttpController,
            reporting_controller_1.ReportingController,
            neural_network_recommendation_controller_1.NeuralNetworkRecommendationController,
        ],
        providers: [
            prisma_service_1.PrismaService,
            data_collection_service_1.DataCollectionService,
            analytics_service_1.AnalyticsService,
            reporting_service_1.ReportingService,
            prometheus_service_1.PrometheusService,
            grafana_service_1.GrafanaService,
            webhook_service_1.WebhookService,
            neural_network_recommendation_service_1.NeuralNetworkRecommendationService,
        ],
        exports: [
            data_collection_service_1.DataCollectionService,
            analytics_service_1.AnalyticsService,
            reporting_service_1.ReportingService,
            prometheus_service_1.PrometheusService,
            grafana_service_1.GrafanaService,
            webhook_service_1.WebhookService,
            neural_network_recommendation_service_1.NeuralNetworkRecommendationService,
        ],
    })
], AnalyticsModule);
//# sourceMappingURL=analytics.module.js.map