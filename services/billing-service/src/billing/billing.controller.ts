import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoggerUtil } from '@ai-aggregator/shared';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor() {}

  @Get('balance/:userId')
  @ApiOperation({ summary: 'Get user balance' })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  async getBalance(@Param('userId') userId: string) {
    try {
      LoggerUtil.debug('billing-service', 'HTTP GetBalance called', { userId });
      
      return {
        success: true,
        message: 'Balance retrieved successfully',
        balance: {
          user_id: userId,
          balance: 100.0,
          currency: 'USD',
          updated_at: new Date().toISOString(),
        },
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

  @Post('balance/:userId/update')
  @ApiOperation({ summary: 'Update user balance' })
  @ApiResponse({ status: 200, description: 'Balance updated successfully' })
  async updateBalance(
    @Param('userId') userId: string,
    @Body() body: { amount: number; operation: string; description?: string }
  ) {
    try {
      LoggerUtil.debug('billing-service', 'HTTP UpdateBalance called', { 
        userId, 
        amount: body.amount,
        operation: body.operation 
      });
      
      return {
        success: true,
        message: 'Balance updated successfully',
        balance: {
          user_id: userId,
          balance: 100.0 + (body.operation === 'add' ? body.amount : -body.amount),
          currency: 'USD',
          updated_at: new Date().toISOString(),
        },
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
  @ApiOperation({ summary: 'Create billing transaction' })
  @ApiResponse({ status: 200, description: 'Transaction created successfully' })
  async createTransaction(@Body() body: {
    user_id: string;
    type: string;
    amount: number;
    description?: string;
    provider?: string;
  }) {
    try {
      LoggerUtil.debug('billing-service', 'HTTP CreateTransaction called', { 
        user_id: body.user_id, 
        type: body.type,
        amount: body.amount 
      });
      
      return {
        success: true,
        message: 'Transaction created successfully',
        transaction: {
          id: `txn_${Date.now()}`,
          user_id: body.user_id,
          type: body.type,
          amount: body.amount,
          description: body.description || 'Transaction',
          provider: body.provider || 'system',
          status: 'completed',
          created_at: new Date().toISOString(),
          metadata: {},
        },
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
        userId,
        page,
        limit 
      });
      
      return {
        success: true,
        message: 'Transaction history retrieved successfully',
        transactions: [],
        pagination: {
          page: page || 1,
          limit: limit || 10,
          total: 0,
          total_pages: 0,
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
  @ApiOperation({ summary: 'Calculate cost for usage' })
  @ApiResponse({ status: 200, description: 'Cost calculated successfully' })
  async calculateCost(@Body() body: {
    user_id: string;
    provider: string;
    input_tokens: number;
    output_tokens: number;
    model: string;
  }) {
    try {
      LoggerUtil.debug('billing-service', 'HTTP CalculateCost called', { 
        user_id: body.user_id,
        provider: body.provider,
        model: body.model 
      });
      
      const inputCost = (body.input_tokens || 0) * 0.001;
      const outputCost = (body.output_tokens || 0) * 0.002;
      
      return {
        success: true,
        message: 'Cost calculated successfully',
        cost: {
          provider: body.provider,
          model: body.model,
          input_tokens: body.input_tokens || 0,
          output_tokens: body.output_tokens || 0,
          input_cost: inputCost,
          output_cost: outputCost,
          total_cost: inputCost + outputCost,
          currency: 'USD',
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
  @ApiResponse({ status: 200, description: 'Payment processed successfully' })
  async processPayment(@Body() body: {
    user_id: string;
    amount: number;
    payment_method: string;
    description?: string;
  }) {
    try {
      LoggerUtil.debug('billing-service', 'HTTP ProcessPayment called', { 
        user_id: body.user_id,
        amount: body.amount,
        payment_method: body.payment_method 
      });
      
      return {
        success: true,
        message: 'Payment processed successfully',
        transaction: {
          id: `payment_${Date.now()}`,
          user_id: body.user_id,
          type: 'credit',
          amount: body.amount,
          description: body.description || 'Payment',
          provider: 'payment_gateway',
          status: 'completed',
          created_at: new Date().toISOString(),
          metadata: {
            payment_method: body.payment_method,
          },
        },
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
}
