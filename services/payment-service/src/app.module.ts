import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { PaymentModule } from './modules/payment/payment.module';
import { YooKassaModule } from './modules/yookassa/yookassa.module';
import { CurrencyModule } from './modules/currency/currency.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    PaymentModule,
    YooKassaModule,
    CurrencyModule,
    WebhookModule,
    HealthModule,
  ],
})
export class AppModule {}
