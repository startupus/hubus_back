import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReferralService } from '../billing/referral.service';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';

@ApiTags('Referral')
@Controller('billing/referral')
@UseGuards(RateLimitGuard)
@ApiBearerAuth()
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get('earnings/:companyId')
  @ApiOperation({ summary: 'Get referral earnings for a company' })
  @ApiResponse({ status: 200, description: 'Referral earnings retrieved successfully' })
  async getReferralEarnings(
    @Param('companyId') companyId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string
  ) {
    return this.referralService.getReferralEarnings(companyId, startDate, endDate, limit);
  }

  @Get('earnings/summary/:companyId')
  @ApiOperation({ summary: 'Get referral earnings summary for a company' })
  @ApiResponse({ status: 200, description: 'Referral earnings summary retrieved successfully' })
  async getReferralEarningsSummary(
    @Param('companyId') companyId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.referralService.getReferralEarningsSummary(companyId, startDate, endDate);
  }

  @Get('referrals/:companyId')
  @ApiOperation({ summary: 'Get referred companies for a company' })
  @ApiResponse({ status: 200, description: 'Referred companies retrieved successfully' })
  async getReferredCompanies(
    @Param('companyId') companyId: string,
    @Query('limit') limit?: string
  ) {
    return this.referralService.getReferredCompanies(companyId, limit);
  }
}
