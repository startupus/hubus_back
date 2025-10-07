import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// import { WinstonModule } from 'nest-winston'; // Временно отключено
import { AnalyticsModule } from './analytics/analytics.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { AnalyticsHttpModule } from './http/http.module';
import { HttpModule } from '@nestjs/axios';
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
    // WinstonModule.forRoot(createLoggerConfig('analytics-service')), // Временно отключено
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 3,
    }),
    PrismaModule,
    AnalyticsModule,
    HealthModule,
    AnalyticsHttpModule,
  ],
})
export class AppModule {}