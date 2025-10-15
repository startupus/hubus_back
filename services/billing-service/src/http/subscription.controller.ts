import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService } from '../billing/subscription.service';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';

@ApiTags('Subscription')
@Controller('billing/subscription')
@UseGuards(RateLimitGuard)
@ApiBearerAuth()
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get all available subscription plans' })
  @ApiResponse({ status: 200, description: 'Subscription plans retrieved successfully' })
  async getSubscriptionPlans() {
    return this.subscriptionService.getSubscriptionPlans();
  }

  @Get('my/:companyId')
  @ApiOperation({ summary: 'Get current company subscription' })
  @ApiResponse({ status: 200, description: 'Current subscription retrieved successfully' })
  async getMySubscription(@Param('companyId') companyId: string) {
    return this.subscriptionService.getMySubscription(companyId);
  }

  @Get('usage/:companyId')
  @ApiOperation({ summary: 'Get subscription usage statistics for a company' })
  @ApiResponse({ status: 200, description: 'Subscription usage statistics retrieved successfully' })
  async getSubscriptionUsage(@Param('companyId') companyId: string) {
    return this.subscriptionService.getSubscriptionUsage(companyId);
  }

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to a plan' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  async subscribeToPlan(@Body() data: { companyId: string; planId: string }) {
    return this.subscriptionService.subscribeToPlan(data.companyId, data.planId);
  }

  @Put('cancel')
  @ApiOperation({ summary: 'Cancel current subscription' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled successfully' })
  async cancelSubscription(@Body() data: { companyId: string }) {
    return this.subscriptionService.cancelSubscription(data.companyId);
  }
}
