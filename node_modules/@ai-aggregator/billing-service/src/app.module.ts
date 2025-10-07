import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validationSchema } from './config/validation.schema';
import configuration from './config/configuration';
import { BillingModule } from './billing/billing.module';
import { BillingHttpModule } from './http/http.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './common/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      envFilePath: ['.env.local', '.env'],
      expandVariables: true,
    }),
    PrismaModule,
    BillingModule,
    BillingHttpModule,
    HealthModule,
  ],
})
export class AppModule {}
