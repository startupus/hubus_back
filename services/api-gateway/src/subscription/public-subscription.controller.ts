import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';

@ApiTags('Public Subscription')
@Controller('subscription')
export class PublicSubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get available subscription plans' })
  @ApiResponse({ status: 200, description: 'Subscription plans retrieved successfully' })
  async getPlans() {
    return this.subscriptionService.getAvailablePlans();
  }
}
