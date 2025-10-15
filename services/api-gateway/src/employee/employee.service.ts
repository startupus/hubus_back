import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class EmployeeService {
  private readonly logger = new Logger(EmployeeService.name);
  private readonly authServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.authServiceUrl = this.configService.get('AUTH_SERVICE_URL', 'http://auth-service:3001');
  }

  async inviteEmployee(companyId: string, createEmployeeDto: any, authToken?: string) {
    this.logger.log(`Inviting employee for company ${companyId}`);

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.authServiceUrl}/auth/employee/invite`, {
          companyId,
          ...createEmployeeDto
        }, {
          headers: {
            'Authorization': authToken || 'Bearer service-token'
          }
        })
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to invite employee', error);
      throw error;
    }
  }

  async getEmployees(companyId: string, status?: string, authToken?: string) {
    this.logger.log(`Getting employees for company ${companyId}`);

    const params = new URLSearchParams();
    if (status) params.append('status', status);

    const url = `${this.authServiceUrl}/auth/employee/${companyId}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'Authorization': authToken || 'Bearer service-token'
          }
        })
      );
      this.logger.log(`Received employees data: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get employees', error);
      throw error;
    }
  }

  async getEmployee(companyId: string, employeeId: string) {
    this.logger.log(`Getting employee ${employeeId} for company ${companyId}`);

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.authServiceUrl}/auth/employee/${companyId}/${employeeId}`)
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get employee', error);
      throw error;
    }
  }

  async updateEmployee(companyId: string, employeeId: string, updateEmployeeDto: any) {
    this.logger.log(`Updating employee ${employeeId} for company ${companyId}`);

    try {
      const response = await firstValueFrom(
        this.httpService.put(`${this.authServiceUrl}/auth/employee/${companyId}/${employeeId}`, updateEmployeeDto)
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update employee', error);
      throw error;
    }
  }

  async removeEmployee(companyId: string, employeeId: string) {
    this.logger.log(`Removing employee ${employeeId} from company ${companyId}`);

    try {
      const response = await firstValueFrom(
        this.httpService.delete(`${this.authServiceUrl}/auth/employee/${companyId}/${employeeId}`)
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to remove employee', error);
      throw error;
    }
  }

  async resendInvitation(companyId: string, employeeId: string) {
    this.logger.log(`Resending invitation to employee ${employeeId} for company ${companyId}`);

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.authServiceUrl}/auth/employee/${companyId}/${employeeId}/resend-invitation`, {})
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to resend invitation', error);
      throw error;
    }
  }

  async updateBillingMode(companyId: string, employeeId: string, billingMode: 'SELF_PAID' | 'PARENT_PAID', authToken?: string) {
    this.logger.log(`Updating billing mode for employee ${employeeId} to ${billingMode}`);
    this.logger.log(`Auth token: ${authToken}`);

    try {
      const response = await firstValueFrom(
        this.httpService.put(`${this.authServiceUrl}/auth/employee/${companyId}/${employeeId}/billing-mode`, {
          billingMode
        }, {
          headers: {
            'Authorization': authToken || 'Bearer service-token'
          }
        })
      );

      // Синхронизируем изменение с billing-service
      try {
        const billingServiceUrl = this.configService.get('BILLING_SERVICE_URL', 'http://billing-service:3004');
        await firstValueFrom(
          this.httpService.post(`${billingServiceUrl}/sync/employee`, {
            id: employeeId,
            billingMode: billingMode
          })
        );
        this.logger.log(`Billing mode change synced with billing-service for employee ${employeeId}`);
      } catch (syncError) {
        this.logger.error('Failed to sync billing mode change with billing-service', syncError);
        // Не прерываем основной процесс, если синхронизация не удалась
      }

      return response.data;
    } catch (error) {
      this.logger.error('Failed to update billing mode', error);
      throw error;
    }
  }
}
