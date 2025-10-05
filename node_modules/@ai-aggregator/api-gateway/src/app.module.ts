import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { BillingModule } from './billing/billing.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AICertificationModule } from './ai-certification/ai-certification.module';
import { OrchestratorModule } from './orchestrator/orchestrator.module';
import { ProxyModule } from './proxy/proxy.module';
import { configuration } from './config/configuration';
import { validationSchema } from './config/validation.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    HealthModule,
    AuthModule,
    ChatModule,
    BillingModule,
    AnalyticsModule,
    AICertificationModule,
    OrchestratorModule,
    ProxyModule,
  ],
})
export class AppModule {}
