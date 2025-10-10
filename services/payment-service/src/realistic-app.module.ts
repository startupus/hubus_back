import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { RealisticPaymentModule } from './modules/payment/realistic-payment.module';
import { RealisticWebhookModule } from './modules/webhook/realistic-webhook.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    RealisticPaymentModule,
    RealisticWebhookModule,
    HealthModule,
  ],
})
export class RealisticAppModule {}
