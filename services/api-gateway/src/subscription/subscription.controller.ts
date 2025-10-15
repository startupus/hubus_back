import { Controller, Get, Post, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Subscription')
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get available subscription plans' })
  @ApiResponse({ status: 200, description: 'Subscription plans retrieved successfully' })
  async getPlans() {
    return this.subscriptionService.getAvailablePlans();
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my current subscription' })
  @ApiResponse({ status: 200, description: 'Current subscription retrieved successfully' })
  async getMySubscription(@Request() req: any) {
    return this.subscriptionService.getCurrentSubscription(req.user.id);
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subscribe to a plan' })
  @ApiResponse({ status: 201, description: 'Successfully subscribed to plan' })
  @ApiResponse({ status: 400, description: 'Invalid plan or insufficient funds' })
  async subscribeToPlan(
    @Request() req: any,
    @Body() body: { planId: string; paymentMethodId?: string }
  ) {
    return this.subscriptionService.subscribeToPlan(req.user.id, body.planId, body.paymentMethodId);
  }

  @Put('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel current subscription' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled successfully' })
  async cancelSubscription(@Request() req: any) {
    return this.subscriptionService.cancelSubscription(req.user.id);
  }

  @Put('upgrade')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upgrade to a higher plan' })
  @ApiResponse({ status: 200, description: 'Subscription upgraded successfully' })
  async upgradeSubscription(
    @Request() req: any,
    @Body() body: { planId: string; paymentMethodId?: string }
  ) {
    return this.subscriptionService.upgradeSubscription(req.user.id, body.planId, body.paymentMethodId);
  }

  @Get('usage')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get subscription usage statistics' })
  @ApiResponse({ status: 200, description: 'Usage statistics retrieved successfully' })
  async getUsageStats(@Request() req: any) {
    return this.subscriptionService.getUsageStats(req.user.id);
  }
}
