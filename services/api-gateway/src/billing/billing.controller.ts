import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { UserBalanceDto } from '@ai-aggregator/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('balance/:companyId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get company balance' })
  @ApiResponse({ status: 200, description: 'Company balance retrieved successfully', type: UserBalanceDto })
  async getBalance(@Param('companyId') companyId: string) {
    return this.billingService.getBalance(companyId);
  }

  @Get('balance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my company balance' })
  @ApiResponse({ status: 200, description: 'Company balance retrieved successfully', type: UserBalanceDto })
  async getMyBalance(@Request() req: any) {
    const response = await this.billingService.getBalance(req.user.id);
    
    // Преобразуем ответ billing service в формат, ожидаемый фронтендом
    return {
      success: true,
      balance: {
        balance: parseFloat(String(response.balance || '0')),
        currency: response.currency || 'USD',
        creditLimit: parseFloat(String((response as any).creditLimit || '0'))
      },
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      }
    };
  }

  @Post('usage/track')
  @ApiOperation({ summary: 'Track usage for billing' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'Company ID' },
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

  @Get('report/:companyId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get billing report for company' })
  @ApiResponse({ status: 200, description: 'Billing report retrieved successfully' })
  async getReport(@Param('companyId') companyId: string) {
    return this.billingService.getReport(companyId);
  }

  @Get('report')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my billing report' })
  @ApiResponse({ status: 200, description: 'Billing report retrieved successfully' })
  async getMyReport(@Request() req: any) {
    return this.billingService.getReport(req.user.id);
  }

  @Post('transaction')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created successfully' })
  async createTransaction(@Body() data: any) {
    return this.billingService.createTransaction(data);
  }

  @Get('transactions/:companyId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get company transactions' })
  @ApiResponse({ status: 200, description: 'Company transactions retrieved successfully' })
  async getTransactions(@Param('companyId') companyId: string) {
    return this.billingService.getTransactions(companyId);
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my transactions' })
  @ApiResponse({ status: 200, description: 'Company transactions retrieved successfully' })
  async getMyTransactions(@Request() req: any) {
    return this.billingService.getTransactions(req.user.id);
  }

  @Post('payment/process')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process payment' })
  @ApiResponse({ status: 201, description: 'Payment processed successfully' })
  async processPayment(@Body() data: any) {
    return this.billingService.processPayment(data);
  }

  @Post('payment/refund')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refund payment' })
  @ApiResponse({ status: 201, description: 'Payment refunded successfully' })
  async refundPayment(@Body() data: any) {
    return this.billingService.refundPayment(data);
  }

  @Post('top-up')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Top up my balance' })
  @ApiResponse({ status: 200, description: 'Balance topped up successfully' })
  async topUpBalance(@Request() req: any, @Body() data: { amount: number; currency?: string }) {
    const response = await this.billingService.topUpBalance(req.user.id, data.amount, data.currency);
    
    // Преобразуем ответ billing service в формат, ожидаемый фронтендом
    return {
      success: true,
      balance: {
        balance: parseFloat(String(response.balance?.balance || '0')),
        currency: response.balance?.currency || 'USD',
        creditLimit: parseFloat(String((response.balance as any)?.creditLimit || '0'))
      },
      message: 'Balance topped up successfully'
    };
  }
}

