import { Controller, Post, Get, Body, Param, Query, HttpCode, HttpStatus, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { LoggerUtil } from '@ai-aggregator/shared';
import { BillingService } from '../billing/billing.service';
import { PricingService } from '../billing/pricing.service';
import { PaymentGatewayService } from '../billing/payment-gateway.service';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';
import { RateLimits } from '../common/decorators/rate-limit.decorator';
import {
  GetBalanceDto,
  UpdateBalanceDto,
  CreateTransactionDto,
  CalculateCostDto,
  ProcessPaymentDto,
  TrackUsageDto,
  BillingReportDto
} from '../dto/billing.dto';
import {
  GetBalanceRequest,
  UpdateBalanceRequest,
  CreateTransactionRequest,
  CalculateCostRequest,
  ProcessPaymentRequest,
  TrackUsageRequest,
  TransactionType
} from '../types/billing.types';

@ApiTags('billing')
@Controller('billing')
@UseGuards(RateLimitGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class HttpController {
  constructor(
    private readonly billingService: BillingService,
    private readonly pricingService: PricingService,
    private readonly paymentGatewayService: PaymentGatewayService
  ) {}

  @Get('balance/:userId')
  @ApiOperation({ summary: 'Get user balance' })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  async getBalance(@Param() params: GetBalanceDto) {
    try {
      LoggerUtil.debug('billing-service', 'HTTP GetBalance called', { company_id: params.userId });
      
      const result = await this.billingService.getBalance({ userId: params.userId });
      
      if (!result.success) {
        return {
          success: false,
          message: result.error || 'Failed to get balance',
          balance: null,
        };
      }

      return {
        success: true,
        message: 'Balance retrieved successfully',
        balance: result.balance,
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'HTTP GetBalance failed', error as Error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        balance: null,
      };
    }
  }

  @Post('balance/update')
  @ApiOperation({ summary: 'Update user balance' })
  @ApiBody({ type: UpdateBalanceDto })
  @ApiResponse({ status: 200, description: 'Balance updated successfully' })
  async updateBalance(@Body() data: UpdateBalanceDto) {
    try {
      LoggerUtil.debug('billing-service', 'HTTP UpdateBalance called', { 
        company_id: data.userId, 
        amount: data.amount,
        operation: data.operation 
      });
      
      const result = await this.billingService.updateBalance(data);
      
      if (!result.success) {
        return {
          success: false,
          message: result.error || 'Failed to update balance',
          balance: null,
        };
      }

      return {
        success: true,
        message: 'Balance updated successfully',
        balance: result.balance,
        transaction: result.transaction,
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'HTTP UpdateBalance failed', error as Error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        balance: null,
      };
    }
  }

  @Post('transactions')
  @ApiOperation({ summary: 'Create transaction' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        type: { type: 'string', enum: ['CREDIT', 'DEBIT', 'REFUND', 'CHARGEBACK'] },
        amount: { type: 'number' },
        currency: { type: 'string' },
        description: { type: 'string' },
        reference: { type: 'string' },
        metadata: { type: 'object' },
        paymentMethodId: { type: 'string' }
      },
      required: ['userId', 'type', 'amount']
    }
  })
  @ApiResponse({ status: 201, description: 'Transaction created successfully' })
  async createTransaction(@Body() data: any) {
    try {
      // Map user_id to userId and convert type to TransactionType
      const request: CreateTransactionRequest = {
        userId: data.user_id || data.userId,
        type: data.type === 'credit' ? TransactionType.CREDIT : 
              data.type === 'debit' ? TransactionType.DEBIT :
              data.type === 'refund' ? TransactionType.REFUND :
              data.type === 'chargeback' ? TransactionType.CHARGEBACK :
              data.type as TransactionType,
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        reference: data.reference,
        metadata: data.metadata,
        paymentMethodId: data.paymentMethodId
      };

      LoggerUtil.debug('billing-service', 'HTTP CreateTransaction called', { 
        company_id: request.userId, 
        type: request.type,
        amount: request.amount 
      });
      
      const result = await this.billingService.createTransaction(request);
      
      if (!result.success) {
        return {
          success: false,
          message: result.error || 'Failed to create transaction',
          transaction: null,
        };
      }

      return {
        success: true,
        message: 'Transaction created successfully',
        transaction: result.transaction,
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'HTTP CreateTransaction failed', error as Error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        transaction: null,
      };
    }
  }

  @Get('transactions/:userId')
  @ApiOperation({ summary: 'Get transaction history' })
  @ApiResponse({ status: 200, description: 'Transaction history retrieved successfully' })
  async getTransactionHistory(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    try {
      LoggerUtil.debug('billing-service', 'HTTP GetTransactionHistory called', { 
        company_id: userId,
        page: page,
        limit: limit 
      });
      
      // TODO: Implement transaction history retrieval with pagination
      return {
        success: true,
        message: 'Transaction history retrieved successfully',
        transactions: [],
        pagination: {
          page: page,
          limit: limit,
          total: 0,
          totalPages: 0,
        },
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'HTTP GetTransactionHistory failed', error as Error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        transactions: [],
        pagination: null,
      };
    }
  }

  @Post('calculate-cost')
  @ApiOperation({ summary: 'Calculate request cost' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        service: { type: 'string' },
        resource: { type: 'string' },
        quantity: { type: 'number' },
        metadata: { type: 'object' }
      },
      required: ['userId', 'service', 'resource', 'quantity']
    }
  })
  @ApiResponse({ status: 200, description: 'Cost calculated successfully' })
  async calculateCost(@Body() data: CalculateCostRequest) {
    try {
      LoggerUtil.debug('billing-service', 'HTTP CalculateCost called', { 
        company_id: data.userId,
        service: data.service,
        resource: data.resource,
        quantity: data.quantity 
      });
      
      const result = await this.billingService.calculateCost(data);
      
      if (!result.success) {
        return {
          success: false,
          message: result.error || 'Failed to calculate cost',
          cost: null,
        };
      }

      return {
        success: true,
        message: 'Cost calculated successfully',
        cost: {
          service: data.service,
          resource: data.resource,
          quantity: data.quantity,
          totalCost: result.cost,
          currency: result.currency,
          breakdown: result.breakdown,
        },
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'HTTP CalculateCost failed', error as Error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        cost: null,
      };
    }
  }

  @Post('payment')
  @ApiOperation({ summary: 'Process payment' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        amount: { type: 'number' },
        currency: { type: 'string' },
        paymentMethodId: { type: 'string' },
        description: { type: 'string' },
        metadata: { type: 'object' }
      },
      required: ['userId', 'amount']
    }
  })
  @ApiResponse({ status: 200, description: 'Payment processed successfully' })
  async processPayment(@Body() data: ProcessPaymentRequest) {
    try {
      LoggerUtil.debug('billing-service', 'HTTP ProcessPayment called', { 
        company_id: data.userId,
        amount: data.amount,
        payment_method_id: data.paymentMethodId 
      });
      
      const result = await this.billingService.processPayment(data);
      
      if (!result.success) {
        return {
          success: false,
          message: result.error || 'Failed to process payment',
          transaction: null,
        };
      }

      return {
        success: true,
        message: 'Payment processed successfully',
        transaction: result.transaction,
        paymentUrl: result.paymentUrl,
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'HTTP ProcessPayment failed', error as Error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        transaction: null,
      };
    }
  }

  @Post('usage/track')
  @ApiOperation({ summary: 'Track usage' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        service: { type: 'string' },
        resource: { type: 'string' },
        quantity: { type: 'number' },
        unit: { type: 'string' },
        metadata: { type: 'object' }
      },
      required: ['userId', 'service', 'resource']
    }
  })
  @ApiResponse({ status: 200, description: 'Usage tracked successfully' })
  async trackUsage(@Body() data: TrackUsageDto) {
    try {
      LoggerUtil.debug('billing-service', 'HTTP TrackUsage called', { 
        company_id: data.userId,
        service: data.service,
        resource: data.resource,
        quantity: data.quantity 
      });
      
      const result = await this.billingService.trackUsage(data);
      
      if (!result.success) {
        return {
          success: false,
          message: result.error || 'Failed to track usage',
          usageEvent: null,
        };
      }

      return {
        success: true,
        message: 'Usage tracked successfully',
        usageEvent: result.usageEvent,
        cost: result.cost,
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'HTTP TrackUsage failed', error as Error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        usageEvent: null,
      };
    }
  }

  @Get('report/:userId')
  @ApiOperation({ summary: 'Get billing report' })
  @ApiResponse({ status: 200, description: 'Billing report generated successfully' })
  async getBillingReport(
    @Param('userId') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    try {
      LoggerUtil.debug('billing-service', 'HTTP GetBillingReport called', { 
        company_id: userId,
        start_date: startDate,
        end_date: endDate
      });
      
      // Устанавливаем дефолтные даты если не переданы
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 дней назад
      const end = endDate ? new Date(endDate) : new Date(); // сейчас
      
      const report = await this.billingService.getBillingReport(userId, start, end);
      
      return {
        success: true,
        message: 'Billing report generated successfully',
        report,
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'HTTP GetBillingReport failed', error as Error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        report: null,
      };
    }
  }

  @Get('company/:companyId/balance')
  @ApiOperation({ summary: 'Get company balance' })
  @ApiResponse({ status: 200, description: 'Company balance retrieved successfully' })
  async getCompanyBalance(@Param('companyId') companyId: string) {
    try {
      LoggerUtil.debug('billing-service', 'HTTP GetCompanyBalance called', { company_id: companyId });
      
      const result = await this.billingService.getBalance({ userId: companyId });
      
      if (!result.success) {
        return {
          success: false,
          message: result.error || 'Failed to get company balance',
          balance: null,
        };
      }

      return {
        success: true,
        message: 'Company balance retrieved successfully',
        balance: result.balance,
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'HTTP GetCompanyBalance failed', error as Error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        balance: null,
      };
    }
  }

  @Get('company/:companyId/transactions')
  @ApiOperation({ summary: 'Get company transactions' })
  @ApiResponse({ status: 200, description: 'Company transactions retrieved successfully' })
  async getCompanyTransactions(
    @Param('companyId') companyId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    try {
      LoggerUtil.debug('billing-service', 'HTTP GetCompanyTransactions called', { 
        company_id: companyId,
        limit,
        offset 
      });
      
      const result = await this.billingService.getTransactions(
        companyId,
        limit || 50,
        offset || 0
      );
      
      return {
        success: true,
        message: 'Company transactions retrieved successfully',
        transactions: result,
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'HTTP GetCompanyTransactions failed', error as Error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        transactions: [],
      };
    }
  }

  @Get('company/:companyId/users/statistics')
  @ApiOperation({ summary: 'Get company users statistics' })
  @ApiResponse({ status: 200, description: 'Company users statistics retrieved successfully' })
  async getCompanyUsersStatistics(
    @Param('companyId') companyId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    try {
      LoggerUtil.debug('billing-service', 'HTTP GetCompanyUsersStatistics called', { 
        company_id: companyId,
        start_date: startDate,
        end_date: endDate
      });
      
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      
      const statistics = await this.billingService.getCompanyUsersStatistics(companyId, start, end);
      
      return {
        success: true,
        message: 'Company users statistics retrieved successfully',
        statistics,
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'HTTP GetCompanyUsersStatistics failed', error as Error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        statistics: null,
      };
    }
  }

  @Get('company/:companyId/report')
  @ApiOperation({ summary: 'Get company billing report' })
  @ApiResponse({ status: 200, description: 'Company billing report generated successfully' })
  async getCompanyBillingReport(
    @Param('companyId') companyId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    try {
      LoggerUtil.debug('billing-service', 'HTTP GetCompanyBillingReport called', { 
        company_id: companyId,
        start_date: startDate,
        end_date: endDate
      });
      
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      
      const report = await this.billingService.getBillingReport(companyId, start, end);
      
      return {
        success: true,
        message: 'Company billing report generated successfully',
        report,
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'HTTP GetCompanyBillingReport failed', error as Error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        report: null,
      };
    }
  }
}