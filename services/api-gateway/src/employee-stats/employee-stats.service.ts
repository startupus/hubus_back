import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class EmployeeStatsService {
  private readonly billingServiceUrl: string;
  private readonly logger = new Logger(EmployeeStatsService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.billingServiceUrl = this.configService.get('BILLING_SERVICE_URL', 'http://billing-service:3004');
  }

  async getEmployeeStats(companyId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.billingServiceUrl}/employee-stats/${companyId}/employees`)
      );
      return response.data;
    } catch (error: any) {
      this.logger.error('Failed to get employee stats', error);
      
      if (error.response?.status) {
        throw new HttpException(
          error.response.data?.message || 'Failed to get employee stats',
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
        error.message || 'Failed to get employee stats',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getEmployeeUsageDetails(companyId: string, employeeId: string, limit?: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.billingServiceUrl}/employee-stats/${companyId}/employees/${employeeId}/usage`, {
          params: { limit }
        })
      );
      return response.data;
    } catch (error: any) {
      this.logger.error('Failed to get employee usage details', error);
      
      if (error.response?.status) {
        throw new HttpException(
          error.response.data?.message || 'Failed to get employee usage details',
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
        error.message || 'Failed to get employee usage details',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
