import { Controller, Get, Post, Body, Param, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReferralService, CreateReferralTransactionDto } from '../billing/referral.service';

@ApiTags('Referral Billing')
@Controller('referral')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get referral statistics for the company' })
  @ApiResponse({ status: 200, description: 'Referral statistics retrieved successfully' })
  async getReferralStats(@Request() req: any) {
    const companyId = req.user.companyId || req.user.sub;
    return this.referralService.getReferralStats(companyId);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get referral transactions for the company' })
  @ApiResponse({ status: 200, description: 'Referral transactions retrieved successfully' })
  async getReferralTransactions(
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const companyId = req.user.companyId || req.user.sub;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const offsetNum = offset ? parseInt(offset, 10) : 0;
    
    return this.referralService.getReferralTransactions(companyId, limitNum, offsetNum);
  }

  @Post('process')
  @ApiOperation({ summary: 'Process referral bonus for a transaction (internal use)' })
  @ApiResponse({ status: 201, description: 'Referral bonus processed successfully' })
  async processReferralBonus(@Body() dto: CreateReferralTransactionDto) {
    await this.referralService.createReferralTransaction(dto);
    return { message: 'Referral bonus processed successfully' };
  }
}
