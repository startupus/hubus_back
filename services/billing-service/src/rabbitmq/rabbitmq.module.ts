import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentConsumerService } from './payment-consumer.service';
import { BillingModule } from '../billing/billing.module';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [ConfigModule, BillingModule, SecurityModule],
  providers: [PaymentConsumerService],
  exports: [PaymentConsumerService],
})
export class RabbitMQModule {}
