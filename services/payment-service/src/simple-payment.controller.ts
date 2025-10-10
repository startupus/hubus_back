import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { SimplePaymentService } from './simple-payment.service';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Controller('payments')
export class SimplePaymentController {
  constructor(private readonly paymentService: SimplePaymentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createPayment(@Body() body: { amount: number; currency?: string }, @Request() req: any) {
    const { amount, currency = 'RUB' } = body;
    console.log('Request body:', body);
    console.log('Request user:', req.user);
    const companyId = req.user?.companyId || req.user?.id;

    if (!companyId) {
      console.error('Company ID not found in token. User object:', req.user);
      throw new Error('Company ID not found in token');
    }

    if (amount < 100) {
      throw new Error('Minimum payment amount is 100 RUB');
    }

    return this.paymentService.createPayment({
      companyId,
      amount,
      currency
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getPayment(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.companyId;
    const payment = await this.paymentService.getPayment(id);
    
    if (payment.companyId !== companyId) {
      throw new Error('Payment not found');
    }

    return payment;
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getCompanyPayments(@Request() req: any) {
    console.log('GET payments - Request user:', req.user);
    const companyId = req.user?.companyId || req.user?.id;
    console.log('GET payments - Company ID:', companyId);
    return this.paymentService.getCompanyPayments(companyId);
  }
}
