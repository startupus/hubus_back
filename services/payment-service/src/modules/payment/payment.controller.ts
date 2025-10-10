import { Controller, Post, Get, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PaymentService, CreatePaymentRequest } from './payment.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('payments')
@Controller('v1/payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create')
  @ApiOperation({ summary: 'Создать платеж' })
  @ApiResponse({ status: 201, description: 'Платеж создан успешно' })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  async createPayment(@Body() data: CreatePaymentRequest) {
    return this.paymentService.createPayment(data);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить платеж по ID' })
  @ApiResponse({ status: 200, description: 'Платеж найден' })
  @ApiResponse({ status: 404, description: 'Платеж не найден' })
  async getPayment(@Param('id') id: string) {
    return this.paymentService.getPayment(id);
  }

  @Get('company/:companyId')
  @ApiOperation({ summary: 'Получить платежи компании' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Список платежей' })
  async getCompanyPayments(
    @Param('companyId') companyId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.paymentService.getCompanyPayments(companyId, page, limit);
  }
}
