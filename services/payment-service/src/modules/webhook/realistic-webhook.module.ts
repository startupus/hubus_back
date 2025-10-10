import { Module } from '@nestjs/common';
import { RealisticWebhookController } from './realistic-webhook.controller';
import { RealisticPaymentService } from '../payment/realistic-payment.service';
import { RealisticYooKassaService } from '../yookassa/realistic-yookassa.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RealisticWebhookController],
  providers: [RealisticPaymentService, RealisticYooKassaService],
})
export class RealisticWebhookModule {}
