import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { PaymentModule } from '../payment/payment.module';
import { YooKassaModule } from '../yookassa/yookassa.module';

@Module({
  imports: [PaymentModule, YooKassaModule],
  controllers: [WebhookController],
})
export class WebhookModule {}
