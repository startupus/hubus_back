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
import { HistoryModule } from './history/history.module';
import { PrismaModule } from './prisma/prisma.module';
import { FsbModule } from './fsb/fsb.module';
import { AnonymizationModule } from './anonymization/anonymization.module';
import { ModelsModule } from './models/models.module';
import { ReferralModule } from './referral/referral.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { EmployeeModule } from './employee/employee.module';
import { EmployeeStatsModule } from './employee-stats/employee-stats.module';
import { SyncModule } from './sync/sync.module';
import { JwtStrategy } from './auth/jwt.strategy';
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
    HistoryModule,
    PrismaModule,
    FsbModule,
    AnonymizationModule,
    ModelsModule,
    ReferralModule,
    SubscriptionModule,
    EmployeeModule,
    EmployeeStatsModule,
    SyncModule,
  ],
  providers: [JwtStrategy],
})
export class AppModule {}
