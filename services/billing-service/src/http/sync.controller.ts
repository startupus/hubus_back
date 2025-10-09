import { Controller, Post, Body, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../common/prisma/prisma.service';
import { LoggerUtil } from '@ai-aggregator/shared';

interface SyncCompanyDto {
  id: string;
  name: string;
  email: string;
  parentCompanyId?: string;
  billingMode?: 'SELF_PAID' | 'PARENT_PAID';
  position?: string;
  department?: string;
}

@ApiTags('sync')
@Controller('sync')
export class SyncController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('company')
  @ApiOperation({ summary: 'Sync company from auth-service' })
  @ApiResponse({ status: 200, description: 'Company synced successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async syncCompany(@Body() dto: SyncCompanyDto) {
    try {
      LoggerUtil.info('billing-service', 'Syncing company', { companyId: dto.id });

      // Check if company already exists
      const existingCompany = await this.prisma.company.findUnique({
        where: { id: dto.id }
      });

      if (existingCompany) {
        // Update existing company
        const updatedCompany = await this.prisma.company.update({
          where: { id: dto.id },
          data: {
            name: dto.name,
            email: dto.email,
            parentCompanyId: dto.parentCompanyId,
            billingMode: dto.billingMode || 'SELF_PAID',
            position: dto.position,
            department: dto.department,
            updatedAt: new Date()
          }
        });

        LoggerUtil.info('billing-service', 'Company updated', { companyId: dto.id });

        return {
          success: true,
          message: 'Company updated successfully',
          company: updatedCompany
        };
      }

      // Create new company
      const newCompany = await this.prisma.company.create({
        data: {
          id: dto.id,
          name: dto.name,
          email: dto.email,
          parentCompanyId: dto.parentCompanyId,
          billingMode: dto.billingMode || 'SELF_PAID',
          position: dto.position,
          department: dto.department,
          isActive: true
        }
      });

      // Create initial balance for the company
      await this.prisma.companyBalance.create({
        data: {
          companyId: newCompany.id,
          balance: 0,
          currency: 'USD',
          creditLimit: 0
        }
      });

      LoggerUtil.info('billing-service', 'Company created and balance initialized', { companyId: dto.id });

      return {
        success: true,
        message: 'Company created successfully',
        company: newCompany
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to sync company', error as Error, { companyId: dto.id });
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to sync company',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

