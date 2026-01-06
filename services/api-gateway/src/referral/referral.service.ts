import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);
  private readonly billingServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.billingServiceUrl = this.configService.get('BILLING_SERVICE_URL', 'http://billing-service:3004');
  }

  async getReferralEarnings(
    companyId: string,
    startDate?: string,
    endDate?: string,
    limit?: string
  ) {
    this.logger.log(`Getting referral earnings for company ${companyId}`);

    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (limit) params.append('limit', limit);

    const url = `${this.billingServiceUrl}/billing/referral/earnings/${companyId}?${params.toString()}`;
    
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'Authorization': 'Bearer service-token',
            'X-Company-Id': companyId
          }
        })
      );
      return response.data;
    } catch (error: any) {
      this.logger.error('Failed to get referral earnings', error);
      
      if (error.response?.status) {
        throw new HttpException(
          error.response.data?.message || 'Failed to get referral earnings',
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
        error.message || 'Failed to get referral earnings',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getReferralEarningsSummary(
    companyId: string,
    startDate?: string,
    endDate?: string
  ) {
    this.logger.log(`Getting referral earnings summary for company ${companyId}`);

    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const url = `${this.billingServiceUrl}/billing/referral/earnings/summary/${companyId}?${params.toString()}`;
    
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'Authorization': 'Bearer service-token',
            'X-Company-Id': companyId
          }
        })
      );
      return response.data;
    } catch (error: any) {
      this.logger.error('Failed to get referral earnings summary', error);
      
      if (error.response?.status) {
        throw new HttpException(
          error.response.data?.message || 'Failed to get referral earnings summary',
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
        error.message || 'Failed to get referral earnings summary',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getReferredCompanies(companyId: string, limit?: string) {
    this.logger.log(`Getting referred companies for company ${companyId}`);

    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);

    const url = `${this.billingServiceUrl}/referral/referrals?${params.toString()}`;
    
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'Authorization': 'Bearer service-token',
            'X-Company-Id': companyId
          }
        })
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get referred companies', error);
      throw error;
    }
  }

  async getReferralCodes(companyId: string) {
    this.logger.log(`Getting referral codes for company ${companyId}`);

    const authServiceUrl = this.configService.get('AUTH_SERVICE_URL', 'http://auth-service:3001');
    const url = `${authServiceUrl}/referral/codes`;
    
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'Authorization': 'Bearer service-token'
          },
          params: {
            companyId: companyId
          }
        })
      );
      return response.data;
    } catch (error: any) {
      this.logger.error('Failed to get referral codes', error);
      
      if (error.response?.status) {
        throw new HttpException(
          error.response.data?.message || 'Failed to get referral codes',
          error.response.status
        );
      }
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw new HttpException(
          'Auth service is unavailable',
          HttpStatus.BAD_GATEWAY
        );
      }
      
      throw new HttpException(
        error.message || 'Failed to get referral codes',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async createReferralCode(
    companyId: string,
    data: {
      description?: string;
      maxUses?: number;
      expiresAt?: string;
    }
  ) {
    this.logger.log(`Creating referral code for company ${companyId}`);
    this.logger.log(`CompanyId type: ${typeof companyId}`);
    this.logger.log(`CompanyId value: ${companyId}`);
    this.logger.log(`Data: ${JSON.stringify(data)}`);

    const authServiceUrl = this.configService.get('AUTH_SERVICE_URL', 'http://auth-service:3001');
    const url = `${authServiceUrl}/referral/codes`;
    
    const requestBody = {
      companyId,
      description: data.description,
      maxUses: data.maxUses,
      expiresAt: data.expiresAt
    };
    
    this.logger.log(`Request body: ${JSON.stringify(requestBody)}`);
    
    try {
      const response = await firstValueFrom(
        this.httpService.post(url, requestBody, {
          headers: {
            'Authorization': 'Bearer service-token'
          }
        })
      );
      this.logger.log(`Received response: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create referral code', error);
      this.logger.error('Error details:', (error as any).response?.data || (error as any).message);
      throw error;
    }
  }
}
