import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoggerUtil } from '@ai-aggregator/shared';

@Injectable()
export class EmployeeService {
  private readonly logger = new Logger(EmployeeService.name);

  constructor(private readonly prisma: PrismaService) {}

  async inviteEmployee(
    companyId: string,
    data: {
      email: string;
      firstName: string;
      lastName: string;
      position?: string;
      department?: string;
      billingMode?: 'SELF_PAID' | 'PARENT_PAID';
    }
  ) {
    this.logger.log(`Inviting employee ${data.email} to company ${companyId}`);

    // Проверяем, что компания существует
    const company = await this.prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Ищем существующего пользователя по email
    const existingUser = await this.prisma.company.findUnique({
      where: { email: data.email }
    });

    if (!existingUser) {
      throw new NotFoundException('User with this email not found. User must be registered first.');
    }

    // Проверяем, что пользователь еще не является сотрудником этой компании
    if (existingUser.parentCompanyId === companyId) {
      throw new ConflictException('User is already an employee of this company');
    }

    // Проверяем, что пользователь не является сотрудником другой компании
    if (existingUser.parentCompanyId && existingUser.parentCompanyId !== companyId) {
      throw new ConflictException('User is already an employee of another company');
    }

    // Обновляем существующего пользователя, делая его сотрудником
    const employee = await this.prisma.company.update({
      where: { id: existingUser.id },
      data: {
        parentCompanyId: companyId,
        position: data.position,
        department: data.department,
        billingMode: data.billingMode || 'PARENT_PAID',
        description: `Employee of ${company.name}`,
        isActive: true // Активируем сотрудника
      }
    });

    // Синхронизируем с billing-service
    try {
      const billingServiceUrl = process.env.BILLING_SERVICE_URL || 'http://billing-service:3004';
      const response = await fetch(`${billingServiceUrl}/sync/employee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: employee.id,
          name: employee.name,
          email: employee.email,
          parentCompanyId: companyId,
          billingMode: data.billingMode || 'PARENT_PAID',
          isActive: true,
          initialBalance: 0.0,
          currency: 'USD'
        })
      });

      if (!response.ok) {
        LoggerUtil.warn('auth-service', 'Failed to sync employee with billing-service', {
          employeeId: employee.id,
          status: response.status,
          statusText: response.statusText
        });
      } else {
        LoggerUtil.info('auth-service', 'Employee synced with billing-service', {
          employeeId: employee.id
        });
      }
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to sync employee with billing-service', error as Error, {
        employeeId: employee.id
      });
    }

    // Логируем событие
    await this.logSecurityEvent(companyId, 'EMPLOYEE_INVITED', 'LOW', `Employee ${data.email} invited`);

    LoggerUtil.info('auth-service', 'Employee invited successfully', {
      companyId,
      employeeId: employee.id,
      employeeEmail: data.email
    });

    return {
      success: true,
      data: {
        id: employee.id,
        email: employee.email,
        firstName: data.firstName,
        lastName: data.lastName,
        position: employee.position,
        department: employee.department,
        status: 'invited',
        invitedAt: employee.createdAt
      }
    };
  }

  async getEmployees(companyId: string) {
    this.logger.log(`Getting employees for company ${companyId}`);

    // Проверяем, что компания существует
    const company = await this.prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Получаем всех сотрудников (дочерние компании)
    const employees = await this.prisma.company.findMany({
      where: {
        parentCompanyId: companyId
      },
      select: {
        id: true,
        name: true,
        email: true,
        position: true,
        department: true,
        billingMode: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        lastLoginAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return {
      success: true,
      data: employees.map(employee => ({
        id: employee.id,
        firstName: employee.name.split(' ')[0] || '',
        lastName: employee.name.split(' ').slice(1).join(' ') || '',
        email: employee.email,
        position: employee.position,
        department: employee.department,
        billingMode: employee.billingMode,
        isActive: employee.isActive,
        isVerified: employee.isVerified,
        status: employee.isActive ? 'active' : 'invited',
        invitedAt: employee.createdAt,
        lastLoginAt: employee.lastLoginAt
      }))
    };
  }

  async removeEmployee(companyId: string, employeeId: string) {
    this.logger.log(`Removing employee ${employeeId} from company ${companyId}`);

    // Проверяем, что компания существует
    const company = await this.prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Проверяем, что сотрудник существует и принадлежит этой компании
    const employee = await this.prisma.company.findFirst({
      where: {
        id: employeeId,
        parentCompanyId: companyId
      }
    });

    if (!employee) {
      throw new NotFoundException('Employee not found or does not belong to this company');
    }

    // Удаляем сотрудника (мягкое удаление - деактивируем)
    await this.prisma.company.update({
      where: { id: employeeId },
      data: {
        isActive: false,
        parentCompanyId: null // Убираем связь с родительской компанией
      }
    });

    // Логируем событие
    await this.logSecurityEvent(companyId, 'EMPLOYEE_REMOVED', 'LOW', `Employee ${employee.email} removed`);

    LoggerUtil.info('auth-service', 'Employee removed successfully', {
      companyId,
      employeeId,
      employeeEmail: employee.email
    });

    return {
      success: true,
      message: 'Employee removed successfully'
    };
  }

  async updateBillingMode(
    companyId: string,
    employeeId: string,
    billingMode: 'SELF_PAID' | 'PARENT_PAID'
  ) {
    this.logger.log(`Updating billing mode for employee ${employeeId} to ${billingMode}`);

    try {
      // Проверяем, что сотрудник существует и принадлежит компании
      const employee = await this.prisma.company.findFirst({
        where: {
          id: employeeId,
          parentCompanyId: companyId
        }
      });

      if (!employee) {
        throw new NotFoundException('Employee not found');
      }

      // Если переключается на PARENT_PAID, проверяем наличие родительской компании
      if (billingMode === 'PARENT_PAID' && !employee.parentCompanyId) {
        throw new ConflictException('Cannot set PARENT_PAID mode without parent company');
      }

      const updatedEmployee = await this.prisma.company.update({
        where: { id: employeeId },
        data: { billingMode }
      });

      // Синхронизируем изменение с billing-service
      try {
        const billingServiceUrl = process.env.BILLING_SERVICE_URL || 'http://billing-service:3004';
        const response = await fetch(`${billingServiceUrl}/sync/employee`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: employeeId,
            name: updatedEmployee.name,
            email: updatedEmployee.email,
            parentCompanyId: updatedEmployee.parentCompanyId,
            billingMode: billingMode,
            isActive: updatedEmployee.isActive,
            initialBalance: 0.0,
            currency: 'USD'
          })
        });

        if (!response.ok) {
          LoggerUtil.warn('auth-service', 'Failed to sync billing mode change with billing-service', {
            employeeId: employeeId,
            status: response.status,
            statusText: response.statusText
          });
        } else {
          LoggerUtil.info('auth-service', 'Billing mode change synced with billing-service', {
            employeeId: employeeId,
            billingMode: billingMode
          });
        }
      } catch (error) {
        LoggerUtil.error('auth-service', 'Failed to sync billing mode change with billing-service', error as Error, {
          employeeId: employeeId
        });
      }

      this.logger.log(`Billing mode updated for employee ${employeeId} to ${billingMode}`);

      return {
        success: true,
        data: updatedEmployee
      };
    } catch (error) {
      this.logger.error('Failed to update billing mode', error);
      throw error;
    }
  }

  private async logSecurityEvent(
    companyId: string,
    type: string,
    severity: string,
    description: string
  ) {
    try {
      await this.prisma.securityEvent.create({
        data: {
          companyId,
          type: type as any,
          severity: severity as any,
          description,
          timestamp: new Date()
        }
      });
    } catch (error) {
      this.logger.warn('Failed to log security event', error);
    }
  }
}
