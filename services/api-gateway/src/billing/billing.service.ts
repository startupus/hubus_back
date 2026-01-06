import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { UserBalanceDto } from '@ai-aggregator/shared';

@Injectable()
export class BillingService {
  private readonly billingServiceUrl: string;
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.billingServiceUrl = this.configService.get('BILLING_SERVICE_URL', 'http://billing-service:3004');
  }

  async getBalance(userId: string): Promise<UserBalanceDto> {
    this.logger.debug('Getting balance for user', { userId, userIdType: typeof userId });
    
    try {
      const url = `${this.billingServiceUrl}/billing/company/${userId}/balance`;
      this.logger.debug('Making request to billing service', { url });
      
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`
          }
        })
      );
      
      this.logger.debug('Billing service response', { 
        status: response.status,
        data: response.data 
      });
      
      return response.data;
    } catch (error: any) {
      this.logger.error('Failed to get balance', { 
        userId, 
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      if (error.response?.status === 404) {
        throw new HttpException('User balance not found', HttpStatus.NOT_FOUND);
      }
      
      if (error.response?.status) {
        throw new HttpException(
          error.response.data?.message || 'Failed to get balance',
          error.response.status
        );
      }
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw new HttpException(
          'Billing service is unavailable',
          HttpStatus.BAD_GATEWAY
        );
      }
      
      throw new HttpException(
        error.message || 'Failed to get balance',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private getAuthToken(): string {
    // Для внутренних вызовов используем сервисный токен
    // В реальном приложении это должен быть сервисный токен
    return 'service-token';
  }

  async trackUsage(data: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.billingServiceUrl}/billing/usage/track`, data)
      );
      return response.data;
    } catch (error: any) {
      this.logger.error('Failed to track usage', error);
      
      if (error.response?.status) {
        throw new HttpException(
          error.response.data?.message || 'Failed to track usage',
          error.response.status
        );
      }
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw new HttpException(
          'Billing service is unavailable',
          HttpStatus.BAD_GATEWAY
        );
      }
      
      throw new HttpException(
        error.message || 'Failed to track usage',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getReport(userId: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.billingServiceUrl}/billing/report/${userId}`)
      );
      return response.data;
    } catch (error: any) {
      this.logger.error('Failed to get billing report', error);
      
      if (error.response?.status) {
        throw new HttpException(
          error.response.data?.message || 'Failed to get billing report',
          error.response.status
        );
      }
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw new HttpException(
          'Billing service is unavailable',
          HttpStatus.BAD_GATEWAY
        );
      }
      
      throw new HttpException(
        error.message || 'Failed to get billing report',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async createTransaction(data: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.billingServiceUrl}/billing/transaction`, data)
      );
      return response.data;
    } catch (error: any) {
      throw new HttpException('Failed to create transaction', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getTransactions(userId: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.billingServiceUrl}/billing/transactions/${userId}`)
      );
      return response.data;
    } catch (error: any) {
      this.logger.error('Failed to get transactions', error);
      
      if (error.response?.status) {
        throw new HttpException(
          error.response.data?.message || 'Failed to get transactions',
          error.response.status
        );
      }
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw new HttpException(
          'Billing service is unavailable',
          HttpStatus.BAD_GATEWAY
        );
      }
      
      throw new HttpException(
        error.message || 'Failed to get transactions',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async processPayment(data: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.billingServiceUrl}/billing/payment/process`, data)
      );
      return response.data;
    } catch (error: any) {
      throw new HttpException('Failed to process payment', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async refundPayment(data: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.billingServiceUrl}/billing/payment/refund`, data)
      );
      return response.data;
    } catch (error: any) {
      throw new HttpException('Failed to refund payment', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async topUpBalance(userId: string, amount: number, currency?: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.billingServiceUrl}/billing/top-up`, {
          companyId: userId,
          amount: amount,
          currency: currency || 'USD'
        })
      );
      return response.data;
    } catch (error: any) {
      throw new HttpException('Failed to top up balance', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

