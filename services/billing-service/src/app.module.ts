import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validationSchema } from './config/validation.schema';
import configuration from './config/configuration';
import { BillingModule } from './billing/billing.module';
import { HttpModule } from './http/http.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      envFilePath: ['.env.local', '.env'],
      expandVariables: true,
    }),
    BillingModule,
    HttpModule,
    HealthModule,
  ],
})
export class AppModule {}
