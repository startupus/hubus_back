import { Controller, Get, Post, Query, UseGuards, Request, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReferralService } from './referral.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Referral')
@Controller('referral')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get('earnings')
  @ApiOperation({ summary: 'Get referral earnings' })
  @ApiResponse({ status: 200, description: 'Referral earnings retrieved successfully' })
  async getReferralEarnings(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string
  ) {
    return this.referralService.getReferralEarnings(req.user.id, startDate, endDate, limit);
  }

  @Get('earnings/summary')
  @ApiOperation({ summary: 'Get referral earnings summary' })
  @ApiResponse({ status: 200, description: 'Referral earnings summary retrieved successfully' })
  async getReferralEarningsSummary(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.referralService.getReferralEarningsSummary(req.user.id, startDate, endDate);
  }

  @Get('referrals')
  @ApiOperation({ summary: 'Get referred companies' })
  @ApiResponse({ status: 200, description: 'Referred companies retrieved successfully' })
  async getReferredCompanies(
    @Request() req: any,
    @Query('limit') limit?: string
  ) {
    return this.referralService.getReferredCompanies(req.user.id, limit);
  }

  @Get('codes')
  @ApiOperation({ summary: 'Get referral codes' })
  @ApiResponse({ status: 200, description: 'Referral codes retrieved successfully' })
  async getReferralCodes(@Request() req: any) {
    const result = await this.referralService.getReferralCodes(req.user.id);
    return { data: result };
  }

  @Post('codes')
  @ApiOperation({ summary: 'Create referral code' })
  @ApiResponse({ status: 201, description: 'Referral code created successfully' })
  async createReferralCode(
    @Request() req: any,
    @Body() data: {
      description?: string;
      maxUses?: number;
      expiresAt?: string;
    }
  ) {
    console.log('Request user:', req.user);
    console.log('User ID:', req.user?.id);
    const result = await this.referralService.createReferralCode(req.user.id, data);
    return { data: result };
  }
}
