import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
// import { LoggerUtil } from '@ai-aggregator/shared';
import { PrismaService } from '../common/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Controller('sync')
export class SyncController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('company')
  @HttpCode(HttpStatus.CREATED)
  async syncCompany(@Body() data: {
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
      console.log('Syncing company from auth-service', {
        companyId: data.id,
        email: data.email
      });

      // Проверяем, существует ли компания
      const existingCompany = await this.prisma.company.findUnique({
        where: { id: data.id }
      });

      if (existingCompany) {
        console.warn('Company already exists', { companyId: data.id });
        return {
          success: true,
          message: 'Company already exists',
          companyId: data.id
        };
      }

      // Создаем компанию
      const company = await this.prisma.company.create({
        data: {
          id: data.id,
          name: data.name,
          email: data.email,
          isActive: data.isActive ?? true,
          billingMode: data.billingMode ?? 'SELF_PAID',
          referredBy: data.referredBy,
          referralCodeId: data.referralCodeId
        }
      });

      // Создаем баланс для компании
      const balance = await this.prisma.companyBalance.create({
        data: {
          companyId: data.id,
          balance: new Decimal(data.initialBalance ?? 100.0),
          currency: data.currency ?? 'USD',
          creditLimit: new Decimal(0)
        }
      });

      console.log('Company synced successfully', {
        companyId: data.id,
        balance: balance.balance.toString()
      });

      return {
        success: true,
        message: 'Company synced successfully',
        company: {
          id: company.id,
          name: company.name,
          email: company.email,
          balance: balance.balance.toString(),
          currency: balance.currency
        }
      };
    } catch (error) {
      console.error('Failed to sync company', error, {
        companyId: data.id
      });
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  @Post('employee')
  @HttpCode(HttpStatus.CREATED)
  async syncEmployee(@Body() data: {
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
      console.log('Syncing employee from auth-service', {
        employeeId: data.id,
        email: data.email,
        parentCompanyId: data.parentCompanyId
      });

      // Проверяем, существует ли сотрудник
      const existingEmployee = await this.prisma.company.findUnique({
        where: { id: data.id }
      });

      if (existingEmployee) {
        // Обновляем существующего сотрудника
        const updatedEmployee = await this.prisma.company.update({
          where: { id: data.id },
          data: {
            name: data.name,
            email: data.email,
            parentCompanyId: data.parentCompanyId,
            billingMode: data.billingMode ?? 'PARENT_PAID',
            isActive: data.isActive ?? true
          }
        });

        console.log('Employee updated successfully', {
          employeeId: data.id,
          parentCompanyId: data.parentCompanyId
        });

        return {
          success: true,
          message: 'Employee updated successfully',
          employee: {
            id: updatedEmployee.id,
            name: updatedEmployee.name,
            email: updatedEmployee.email,
            parentCompanyId: updatedEmployee.parentCompanyId,
            billingMode: updatedEmployee.billingMode
          }
        };
      } else {
        // Создаем нового сотрудника
        const employee = await this.prisma.company.create({
          data: {
            id: data.id,
            name: data.name,
            email: data.email,
            parentCompanyId: data.parentCompanyId,
            billingMode: data.billingMode ?? 'PARENT_PAID',
            isActive: data.isActive ?? true
          }
        });

        // Создаем баланс для сотрудника
        const balance = await this.prisma.companyBalance.create({
          data: {
            companyId: data.id,
            balance: new Decimal(data.initialBalance ?? 0.0),
            currency: data.currency ?? 'USD',
            creditLimit: new Decimal(0)
          }
        });

        console.log('Employee created successfully', {
          employeeId: data.id,
          parentCompanyId: data.parentCompanyId,
          balance: balance.balance.toString()
        });

        return {
          success: true,
          message: 'Employee created successfully',
          employee: {
            id: employee.id,
            name: employee.name,
            email: employee.email,
            parentCompanyId: employee.parentCompanyId,
            billingMode: employee.billingMode,
            balance: balance.balance.toString(),
            currency: balance.currency
          }
        };
      }
    } catch (error) {
      console.error('Failed to sync employee', error, {
        employeeId: data.id,
        parentCompanyId: data.parentCompanyId
      });
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}