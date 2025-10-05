import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { UserBalanceDto } from '@ai-aggregator/shared';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('balance/:userId')
  @ApiOperation({ summary: 'Get user balance' })
  @ApiResponse({ status: 200, description: 'User balance retrieved successfully', type: UserBalanceDto })
  async getBalance(@Param('userId') userId: string) {
    return this.billingService.getBalance(userId);
  }

  @Post('usage/track')
  @ApiOperation({ summary: 'Track usage for billing' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        service: { type: 'string' },
        resource: { type: 'string' },
        quantity: { type: 'number' }
      },
      required: ['userId', 'service', 'resource', 'quantity']
    }
  })
  @ApiResponse({ status: 200, description: 'Usage tracked successfully' })
  async trackUsage(@Body() data: any) {
    return this.billingService.trackUsage(data);
  }

  @Get('report/:userId')
  @ApiOperation({ summary: 'Get billing report for user' })
  @ApiResponse({ status: 200, description: 'Billing report retrieved successfully' })
  async getReport(@Param('userId') userId: string) {
    return this.billingService.getReport(userId);
  }

  @Post('transaction')
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created successfully' })
  async createTransaction(@Body() data: any) {
    return this.billingService.createTransaction(data);
  }

  @Get('transactions/:userId')
  @ApiOperation({ summary: 'Get user transactions' })
  @ApiResponse({ status: 200, description: 'User transactions retrieved successfully' })
  async getTransactions(@Param('userId') userId: string) {
    return this.billingService.getTransactions(userId);
  }

  @Post('payment/process')
  @ApiOperation({ summary: 'Process payment' })
  @ApiResponse({ status: 201, description: 'Payment processed successfully' })
  async processPayment(@Body() data: any) {
    return this.billingService.processPayment(data);
  }

  @Post('payment/refund')
  @ApiOperation({ summary: 'Refund payment' })
  @ApiResponse({ status: 201, description: 'Payment refunded successfully' })
  async refundPayment(@Body() data: any) {
    return this.billingService.refundPayment(data);
  }
}

