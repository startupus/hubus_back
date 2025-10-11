import { Module } from '@nestjs/common';
import { RealisticWebhookController } from './realistic-webhook.controller';
import { RealisticPaymentService } from '../payment/realistic-payment.service';
import { RealisticYooKassaService } from '../yookassa/realistic-yookassa.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { RabbitMQService } from '../../rabbitmq/rabbitmq.service';

@Module({
  imports: [PrismaModule],
  controllers: [RealisticWebhookController],
  providers: [RealisticPaymentService, RealisticYooKassaService, RabbitMQService],
})
export class RealisticWebhookModule {}
