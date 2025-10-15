import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { PublicSubscriptionController } from './public-subscription.controller';
import { SubscriptionService } from './subscription.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [SubscriptionController, PublicSubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService]
})
export class SubscriptionModule {}
