import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SyncService } from './sync.service';

@ApiTags('sync')
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('company')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Sync company data from auth-service' })
  @ApiResponse({ status: 201, description: 'Company synced successfully' })
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
    return this.syncService.syncCompany(data);
  }

  @Post('employee')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Sync employee data from auth-service' })
  @ApiResponse({ status: 201, description: 'Employee synced successfully' })
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
    return this.syncService.syncEmployee(data);
  }
}
