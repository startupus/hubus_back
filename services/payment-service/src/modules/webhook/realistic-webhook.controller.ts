import { Controller, Post, Body, Headers, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { RealisticPaymentService } from '../payment/realistic-payment.service';
import { RealisticYooKassaService } from '../yookassa/realistic-yookassa.service';

@Controller('webhooks')
export class RealisticWebhookController {
  private readonly logger = new Logger(RealisticWebhookController.name);

  constructor(
    private readonly paymentService: RealisticPaymentService,
    private readonly yooKassaService: RealisticYooKassaService
  ) {}

  @Post('yookassa')
  async handleYooKassaWebhook(
    @Body() webhookData: any,
    @Headers() headers: Record<string, string>
  ) {
    try {
      this.logger.log('Received YooKassa webhook', {
        event: webhookData?.event,
        paymentId: webhookData?.object?.id,
        headers: Object.keys(headers)
      });

      // В реальной реализации здесь будет проверка подписи webhook'а
      // const signature = headers['x-yookassa-signature'];
      // const isValid = await this.yooKassaService.verifyWebhookSignature(webhookData, signature);
      // if (!isValid) {
      //   throw new HttpException('Invalid webhook signature', HttpStatus.UNAUTHORIZED);
      // }

      const result = await this.paymentService.processWebhook(webhookData);

      this.logger.log('Webhook processed successfully', result);

      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      this.logger.error('Failed to process YooKassa webhook', error);
      throw new HttpException(
        `Webhook processing failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('test')
  async handleTestWebhook(@Body() testData: any) {
    this.logger.log('Received test webhook', testData);
    
    // Имитируем обработку тестового webhook'а
    const mockWebhookData = {
      event: 'payment.succeeded',
      object: {
        id: testData.paymentId || 'test_payment_123',
        amount: {
          value: testData.amount || '1000.00',
          currency: testData.currency || 'RUB'
        },
        status: 'succeeded'
      }
    };

    try {
      const result = await this.paymentService.processWebhook(mockWebhookData);
      return { success: true, message: 'Test webhook processed', result };
    } catch (error) {
      this.logger.error('Failed to process test webhook', error);
      throw new HttpException(
        `Test webhook processing failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
