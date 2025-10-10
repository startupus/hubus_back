import { Controller, Post, Body, Headers, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentService } from '../payment/payment.service';
import { YooKassaService } from '../yookassa/yookassa.service';
import { LoggerUtil } from '@ai-aggregator/shared';

@ApiTags('webhook')
@Controller('v1/webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly yooKassa: YooKassaService,
  ) {}

  @Post('yookassa')
  @ApiOperation({ summary: 'Webhook от ЮKassa' })
  @ApiResponse({ status: 200, description: 'Webhook обработан' })
  async handleYooKassaWebhook(
    @Body() body: any,
    @Headers() headers: any,
  ) {
    try {
      // Проверяем подпись webhook'а (рекомендуется для продакшена)
      // const signature = headers['x-yookassa-signature'];
      // if (!this.verifySignature(body, signature)) {
      //   throw new Error('Invalid signature');
      // }

      const { event, object } = body;

      LoggerUtil.info('payment-service', 'YooKassa webhook received', {
        event,
        paymentId: object.id,
      });

      // Обрабатываем только успешные платежи
      if (event === 'payment.succeeded') {
        // Находим платеж по yookassaId
        const payment = await this.paymentService.getPaymentByYooKassaId(object.id);
        
        if (payment && payment.status === 'PENDING') {
          // Обрабатываем успешный платеж
          await this.paymentService.processSuccessfulPayment(payment.id);
          
          LoggerUtil.info('payment-service', 'Payment processed successfully', {
            paymentId: payment.id,
            companyId: payment.companyId,
          });
        }
      }

      return { status: 'ok' };
    } catch (error) {
      LoggerUtil.error('payment-service', 'Webhook processing failed', error as Error);
      throw error;
    }
  }

  // Метод для проверки подписи (рекомендуется для продакшена)
  private verifySignature(body: any, signature: string): boolean {
    // TODO: Реализовать проверку подписи
    return true;
  }
}
