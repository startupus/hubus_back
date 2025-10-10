import { Module } from '@nestjs/common';
import { HttpController } from './http.controller';
import { SyncController } from './sync.controller';
import { ReferralController } from './referral.controller';
import { BillingModule } from '../billing/billing.module';
import { PrismaModule } from '../common/prisma/prisma.module';
import { ReferralService } from '../billing/referral.service';

@Module({
  imports: [BillingModule, PrismaModule],
  controllers: [HttpController, SyncController, ReferralController],
  providers: [ReferralService],
})
export class BillingHttpModule {}
