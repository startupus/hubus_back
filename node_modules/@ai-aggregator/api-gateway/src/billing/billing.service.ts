import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { UserBalanceDto } from '@ai-aggregator/shared';

@Injectable()
export class BillingService {
  private readonly billingServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.billingServiceUrl = this.configService.get('BILLING_SERVICE_URL', 'http://billing-service:3004');
  }

  async getBalance(userId: string): Promise<UserBalanceDto> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.billingServiceUrl}/billing/balance/${userId}`)
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new HttpException('User balance not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException('Failed to get balance', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async trackUsage(data: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.billingServiceUrl}/billing/usage/track`, data)
      );
      return response.data;
    } catch (error: any) {
      throw new HttpException('Failed to track usage', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getReport(userId: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.billingServiceUrl}/billing/report/${userId}`)
      );
      return response.data;
    } catch (error: any) {
      throw new HttpException('Failed to get billing report', HttpStatus.INTERNAL_SERVER_ERROR);
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
      throw new HttpException('Failed to get transactions', HttpStatus.INTERNAL_SERVER_ERROR);
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
}

