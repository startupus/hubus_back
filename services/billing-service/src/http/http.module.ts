import { Module } from '@nestjs/common';
import { HttpController } from './http.controller';
import { SyncController } from './sync.controller';
import { ReferralController } from './referral.controller';
import { SubscriptionController } from './subscription.controller';
import { BillingModule } from '../billing/billing.module';
import { PrismaModule } from '../common/prisma/prisma.module';
import { ReferralService } from '../billing/referral.service';
import { SubscriptionService } from '../billing/subscription.service';

@Module({
  imports: [BillingModule, PrismaModule],
  controllers: [HttpController, SyncController, ReferralController, SubscriptionController],
  providers: [ReferralService, SubscriptionService],
})
export class BillingHttpModule {}
