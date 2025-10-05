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
import { HttpController } from '../http/http.controller';
import { ReportingController } from '../controllers/reporting.controller';

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
  ],
  providers: [
    PrismaService,
    DataCollectionService,
    AnalyticsService,
    ReportingService,
    PrometheusService,
    GrafanaService,
    WebhookService,
  ],
  exports: [
    DataCollectionService,
    AnalyticsService,
    ReportingService,
    PrometheusService,
    GrafanaService,
    WebhookService,
  ],
})
export class AnalyticsModule {}
