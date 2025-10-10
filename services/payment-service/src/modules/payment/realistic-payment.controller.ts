import { Controller, Post, Get, Body, Param, UseGuards, Request, Query, HttpException, HttpStatus } from '@nestjs/common';
import { RealisticPaymentService } from './realistic-payment.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('payments')
export class RealisticPaymentController {
  constructor(private readonly paymentService: RealisticPaymentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createPayment(
    @Body() body: { 
      amount: number; 
      currency?: string; 
      description?: string;
    }, 
    @Request() req: any
  ) {
    const { amount, currency = 'RUB', description } = body;
    const companyId = req.user?.companyId || req.user?.id;

    if (!companyId) {
      throw new HttpException('Company ID not found in token', HttpStatus.UNAUTHORIZED);
    }

    if (amount < 100) {
      throw new HttpException('Minimum payment amount is 100 RUB', HttpStatus.BAD_REQUEST);
    }

    if (amount > 1000000) {
      throw new HttpException('Maximum payment amount is 1,000,000 RUB', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.paymentService.createPayment({
        companyId,
        amount,
        currency,
        description
      });
    } catch (error) {
      throw new HttpException(
        `Failed to create payment: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getPayment(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user?.companyId || req.user?.id;

    if (!companyId) {
      throw new HttpException('Company ID not found in token', HttpStatus.UNAUTHORIZED);
    }

    try {
      return await this.paymentService.getPayment(id, companyId);
    } catch (error) {
      if (error.message === 'Payment not found') {
        throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        `Failed to get payment: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getCompanyPayments(
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    const companyId = req.user?.companyId || req.user?.id;

    if (!companyId) {
      throw new HttpException('Company ID not found in token', HttpStatus.UNAUTHORIZED);
    }

    const limitNum = limit ? parseInt(limit, 10) : 50;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    if (limitNum > 100) {
      throw new HttpException('Maximum limit is 100', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.paymentService.getCompanyPayments(companyId, limitNum, offsetNum);
    } catch (error) {
      throw new HttpException(
        `Failed to get payments: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('stats/summary')
  @UseGuards(JwtAuthGuard)
  async getPaymentStats(@Request() req: any) {
    const companyId = req.user?.companyId || req.user?.id;

    if (!companyId) {
      throw new HttpException('Company ID not found in token', HttpStatus.UNAUTHORIZED);
    }

    try {
      return await this.paymentService.getPaymentStats(companyId);
    } catch (error) {
      throw new HttpException(
        `Failed to get payment stats: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
