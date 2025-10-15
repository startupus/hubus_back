import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SyncService {
  private readonly billingServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.billingServiceUrl = this.configService.get('BILLING_SERVICE_URL', 'http://billing-service:3004');
  }

  async syncCompany(data: {
    id: string;
    name: string;
    email: string;
    isActive?: boolean;
    billingMode?: 'SELF_PAID' | 'PARENT_PAID';
    initialBalance?: number;
    currency?: string;
    referredBy?: string;
    referralCodeId?: string;
  }) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.billingServiceUrl}/sync/company`, data)
      );
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to sync company',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async syncEmployee(data: {
    id: string;
    name: string;
    email: string;
    parentCompanyId: string;
    billingMode?: 'SELF_PAID' | 'PARENT_PAID';
    isActive?: boolean;
    initialBalance?: number;
    currency?: string;
  }) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.billingServiceUrl}/sync/employee`, data)
      );
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to sync employee',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
