import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);
  private readonly billingServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.billingServiceUrl = this.configService.get('BILLING_SERVICE_URL', 'http://billing-service:3004');
  }

  async getAvailablePlans() {
    this.logger.log('Getting available subscription plans');

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.billingServiceUrl}/billing/subscription/plans`)
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get available plans', error);
      throw error;
    }
  }

  async getCurrentSubscription(companyId: string) {
    this.logger.log(`Getting current subscription for company ${companyId}`);

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.billingServiceUrl}/billing/subscription/my/${companyId}`)
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get current subscription', error);
      throw error;
    }
  }

  async subscribeToPlan(companyId: string, planId: string, paymentMethodId?: string) {
    this.logger.log(`Subscribing company ${companyId} to plan ${planId}`);

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.billingServiceUrl}/billing/subscription/subscribe`, {
          companyId,
          planId,
          paymentMethodId
        })
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to subscribe to plan', error);
      throw error;
    }
  }

  async cancelSubscription(companyId: string) {
    this.logger.log(`Cancelling subscription for company ${companyId}`);

    try {
      const response = await firstValueFrom(
        this.httpService.put(`${this.billingServiceUrl}/billing/subscription/cancel`, { companyId })
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to cancel subscription', error);
      throw error;
    }
  }

  async upgradeSubscription(companyId: string, planId: string, paymentMethodId?: string) {
    this.logger.log(`Upgrading subscription for company ${companyId} to plan ${planId}`);

    try {
      const response = await firstValueFrom(
        this.httpService.put(`${this.billingServiceUrl}/billing/subscription/upgrade`, {
          companyId,
          planId,
          paymentMethodId
        })
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to upgrade subscription', error);
      throw error;
    }
  }

  async getUsageStats(companyId: string) {
    this.logger.log(`Getting usage stats for company ${companyId}`);

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.billingServiceUrl}/billing/subscription/usage/${companyId}`)
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get usage stats', error);
      throw error;
    }
  }
}
