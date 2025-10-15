import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class EmployeeStatsService {
  private readonly billingServiceUrl: string;

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
      throw new Error(`Failed to get employee stats: ${error.response?.data?.message || error.message}`);
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
      throw new Error(`Failed to get employee usage details: ${error.response?.data?.message || error.message}`);
    }
  }
}
