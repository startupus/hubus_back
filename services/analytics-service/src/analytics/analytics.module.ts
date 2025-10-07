import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PrismaService } from '../common/prisma/prisma.service';
import { DataCollectionService } from '../services/data-collection.service';
import { AnalyticsService } from '../services/analytics.service';
import { ReportingService } from '../services/reporting.service';
import { PrometheusService } from '../integrations/prometheus.service';
import { GrafanaService } from '../integrations/grafana.service';
import { WebhookService } from '../integrations/webhook.service';
import { NeuralNetworkRecommendationService } from './neural-network-recommendation.service';
import { NeuralNetworkRecommendationController } from './neural-network-recommendation.controller';
import { HttpController } from '../http/http.controller';
import { ReportingController } from '../controllers/reporting.controller';
import { AnalyticsCacheService } from './analytics-cache.service';
import { ConcurrentAnalyticsService } from './concurrent-analytics.service';
import { CriticalOperationsService } from './critical-operations.service';
import { RedisClient, RabbitMQClient, ThreadPoolService } from '@ai-aggregator/shared';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 3,
    }),
  ],
  controllers: [
    HttpController,
    ReportingController,
    NeuralNetworkRecommendationController,
  ],
  providers: [
    PrismaService,
    DataCollectionService,
    AnalyticsService,
    ReportingService,
    PrometheusService,
    GrafanaService,
    WebhookService,
    NeuralNetworkRecommendationService,
    AnalyticsCacheService,
    ConcurrentAnalyticsService,
    CriticalOperationsService,
    RedisClient,
    RabbitMQClient,
    ThreadPoolService,
  ],
  exports: [
    DataCollectionService,
    AnalyticsService,
    ReportingService,
    PrometheusService,
    GrafanaService,
    WebhookService,
    NeuralNetworkRecommendationService,
    AnalyticsCacheService,
    ConcurrentAnalyticsService,
    CriticalOperationsService,
  ],
})
export class AnalyticsModule {}
