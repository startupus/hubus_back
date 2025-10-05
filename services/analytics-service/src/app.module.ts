import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { AnalyticsModule } from './analytics/analytics.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { HttpModule } from './http/http.module';
import { configuration } from './config/configuration';
import { validationSchema } from './config/validation.schema';
import { createLoggerConfig } from './config/logger.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      envFilePath: ['.env.local', '.env'],
    }),
    WinstonModule.forRoot(createLoggerConfig('analytics-service')),
    PrismaModule,
    AnalyticsModule,
    HealthModule,
    HttpModule,
  ],
})
export class AppModule {}