import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PricingService } from './pricing.service';
import { CreatePricingPlanDto, UpdatePricingPlanDto, SubscribeToPlanDto } from './dto/pricing.dto';

@ApiTags('pricing')
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get all pricing plans' })
  @ApiResponse({ status: 200, description: 'Pricing plans retrieved successfully' })
  @ApiQuery({ name: 'active', required: false, description: 'Filter by active status' })
  async getPricingPlans(@Query('active') active?: boolean) {
    return this.pricingService.getPricingPlans(active);
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Get pricing plan by ID' })
  @ApiParam({ name: 'id', description: 'Pricing plan ID' })
  @ApiResponse({ status: 200, description: 'Pricing plan retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Pricing plan not found' })
  async getPricingPlan(@Param('id') id: string) {
    return this.pricingService.getPricingPlan(id);
  }

  @Post('plans')
  @ApiOperation({ summary: 'Create new pricing plan' })
  @ApiResponse({ status: 201, description: 'Pricing plan created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async createPricingPlan(@Body() createPricingPlanDto: CreatePricingPlanDto) {
    return this.pricingService.createPricingPlan(createPricingPlanDto);
  }

  @Put('plans/:id')
  @ApiOperation({ summary: 'Update pricing plan' })
  @ApiParam({ name: 'id', description: 'Pricing plan ID' })
  @ApiResponse({ status: 200, description: 'Pricing plan updated successfully' })
  @ApiResponse({ status: 404, description: 'Pricing plan not found' })
  async updatePricingPlan(
    @Param('id') id: string,
    @Body() updatePricingPlanDto: UpdatePricingPlanDto
  ) {
    return this.pricingService.updatePricingPlan(id, updatePricingPlanDto);
  }

  @Delete('plans/:id')
  @ApiOperation({ summary: 'Delete pricing plan' })
  @ApiParam({ name: 'id', description: 'Pricing plan ID' })
  @ApiResponse({ status: 200, description: 'Pricing plan deleted successfully' })
  @ApiResponse({ status: 404, description: 'Pricing plan not found' })
  async deletePricingPlan(@Param('id') id: string) {
    return this.pricingService.deletePricingPlan(id);
  }

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe company to pricing plan' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async subscribeToPlan(@Body() subscribeToPlanDto: SubscribeToPlanDto) {
    return this.pricingService.subscribeToPlan(subscribeToPlanDto);
  }

  @Get('subscriptions/:companyId')
  @ApiOperation({ summary: 'Get company subscriptions' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Subscriptions retrieved successfully' })
  async getCompanySubscriptions(@Param('companyId') companyId: string) {
    return this.pricingService.getCompanySubscriptions(companyId);
  }

  @Get('subscriptions/:companyId/active')
  @ApiOperation({ summary: 'Get active company subscription' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Active subscription retrieved successfully' })
  @ApiResponse({ status: 404, description: 'No active subscription found' })
  async getActiveSubscription(@Param('companyId') companyId: string) {
    return this.pricingService.getActiveSubscription(companyId);
  }

  @Post('subscriptions/:subscriptionId/cancel')
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiParam({ name: 'subscriptionId', description: 'Subscription ID' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async cancelSubscription(@Param('subscriptionId') subscriptionId: string) {
    return this.pricingService.cancelSubscription(subscriptionId);
  }

  @Get('subscriptions/:subscriptionId/usage')
  @ApiOperation({ summary: 'Get subscription token usage' })
  @ApiParam({ name: 'subscriptionId', description: 'Subscription ID' })
  @ApiResponse({ status: 200, description: 'Usage retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async getSubscriptionUsage(@Param('subscriptionId') subscriptionId: string) {
    return this.pricingService.getSubscriptionUsage(subscriptionId);
  }
}
