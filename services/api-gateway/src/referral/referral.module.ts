import { Module } from '@nestjs/common';
import { ReferralController } from './referral.controller';
import { ReferralService } from './referral.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [ReferralController],
  providers: [ReferralService],
  exports: [ReferralService]
})
export class ReferralModule {}
