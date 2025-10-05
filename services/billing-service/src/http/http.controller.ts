import { Controller, Post, Get, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { LoggerUtil } from '@ai-aggregator/shared';

@ApiTags('billing')
@Controller('billing')
export class HttpController {
  constructor() {}

  @Get('balance/:userId')
  @ApiOperation({ summary: 'Get user balance' })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  async getBalance(@Param('userId') userId: string) {
    try {
      LoggerUtil.debug('billing-service', 'HTTP GetBalance called', { user_id: userId });
      
      // Заглушка - в реальном проекте здесь будет обращение к базе данных
      return {
        success: true,
        message: 'Balance retrieved successfully',
        balance: {
          userId: userId,
          balance: 100.0,
          currency: 'USD',
          updatedAt: new Date().toISOString(),
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

  @Post('balance/update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user balance' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        amount: { type: 'number' },
        operation: { type: 'string', enum: ['add', 'subtract'] }
      },
      required: ['userId', 'amount', 'operation']
    }
  })
  @ApiResponse({ status: 200, description: 'Balance updated successfully' })
  async updateBalance(@Body() data: any) {
    try {
      LoggerUtil.debug('billing-service', 'HTTP UpdateBalance called', { 
        user_id: data.userId, 
        amount: data.amount,
        operation: data.operation 
      });
      
      // Заглушка - в реальном проекте здесь будет обновление баланса в БД
      return {
        success: true,
        message: 'Balance updated successfully',
        balance: {
          userId: data.userId,
          balance: 100.0 + (data.operation === 'add' ? data.amount : -data.amount),
          currency: 'USD',
          updatedAt: new Date().toISOString(),
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
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create transaction' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        type: { type: 'string', enum: ['credit', 'debit'] },
        amount: { type: 'number' },
        description: { type: 'string' },
        provider: { type: 'string' },
        metadata: { type: 'object' }
      },
      required: ['userId', 'type', 'amount']
    }
  })
  @ApiResponse({ status: 201, description: 'Transaction created successfully' })
  async createTransaction(@Body() data: any) {
    try {
      LoggerUtil.debug('billing-service', 'HTTP CreateTransaction called', { 
        user_id: data.userId, 
        type: data.type,
        amount: data.amount 
      });
      
      // Заглушка - в реальном проекте здесь будет создание транзакции в БД
      return {
        success: true,
        message: 'Transaction created successfully',
        transaction: {
          id: `txn_${Date.now()}`,
          userId: data.userId,
          type: data.type,
          amount: data.amount,
          description: data.description || 'Transaction',
          provider: data.provider || 'system',
          status: 'completed',
          createdAt: new Date().toISOString(),
          metadata: data.metadata || {},
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
        user_id: userId,
        page: page,
        limit: limit 
      });
      
      // Заглушка - в реальном проекте здесь будет запрос к БД
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate request cost' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        provider: { type: 'string' },
        model: { type: 'string' },
        inputTokens: { type: 'number' },
        outputTokens: { type: 'number' }
      },
      required: ['userId', 'provider', 'model']
    }
  })
  @ApiResponse({ status: 200, description: 'Cost calculated successfully' })
  async calculateCost(@Body() data: any) {
    try {
      LoggerUtil.debug('billing-service', 'HTTP CalculateCost called', { 
        user_id: data.userId,
        provider: data.provider,
        model: data.model 
      });
      
      // Заглушка - в реальном проекте здесь будет расчет стоимости
      const inputCost = (data.inputTokens || 0) * 0.001;
      const outputCost = (data.outputTokens || 0) * 0.002;
      
      return {
        success: true,
        message: 'Cost calculated successfully',
        cost: {
          provider: data.provider,
          model: data.model,
          inputTokens: data.inputTokens || 0,
          outputTokens: data.outputTokens || 0,
          inputCost: inputCost,
          outputCost: outputCost,
          totalCost: inputCost + outputCost,
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process payment' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        amount: { type: 'number' },
        paymentMethod: { type: 'string' },
        description: { type: 'string' }
      },
      required: ['userId', 'amount', 'paymentMethod']
    }
  })
  @ApiResponse({ status: 200, description: 'Payment processed successfully' })
  async processPayment(@Body() data: any) {
    try {
      LoggerUtil.debug('billing-service', 'HTTP ProcessPayment called', { 
        user_id: data.userId,
        amount: data.amount,
        payment_method: data.paymentMethod 
      });
      
      // Заглушка - в реальном проекте здесь будет обработка платежа
      return {
        success: true,
        message: 'Payment processed successfully',
        transaction: {
          id: `payment_${Date.now()}`,
          userId: data.userId,
          type: 'credit',
          amount: data.amount,
          description: data.description || 'Payment',
          provider: 'payment_gateway',
          status: 'completed',
          createdAt: new Date().toISOString(),
          metadata: {
            paymentMethod: data.paymentMethod,
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
