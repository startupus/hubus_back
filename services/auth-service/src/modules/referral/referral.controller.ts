import { Controller, Get, Post, Delete, Param, Body, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReferralService, CreateReferralCodeDto, ReferralCodeResponse, ReferralStatsResponse } from './referral.service';

@ApiTags('Referral System')
@Controller('referral')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Post('codes')
  @ApiOperation({ summary: 'Create a new referral code' })
  @ApiResponse({ status: 201, description: 'Referral code created successfully', type: ReferralCodeResponse })
  @ApiResponse({ status: 404, description: 'Company not found' })
  @ApiResponse({ status: 409, description: 'Failed to generate unique code' })
  async createReferralCode(
    @Request() req: any,
    @Body() createDto: CreateReferralCodeDto,
  ): Promise<ReferralCodeResponse> {
    // For testing, get companyId from the request body
    const companyId = createDto.companyId;
    return this.referralService.createReferralCode(companyId, createDto);
  }

  @Get('codes')
  @ApiOperation({ summary: 'Get all referral codes for the company' })
  @ApiResponse({ status: 200, description: 'Referral codes retrieved successfully', type: [ReferralCodeResponse] })
  async getReferralCodes(@Request() req: any): Promise<ReferralCodeResponse[]> {
    const companyId = req.user.companyId || req.user.sub;
    return this.referralService.getReferralCodes(companyId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get referral statistics for the company' })
  @ApiResponse({ status: 200, description: 'Referral statistics retrieved successfully', type: ReferralStatsResponse })
  async getReferralStats(@Request() req: any, @Query('companyId') companyId?: string): Promise<ReferralStatsResponse> {
    // For testing, get companyId from query parameter, otherwise from JWT token
    const finalCompanyId = companyId || req.user?.companyId || req.user?.sub;
    if (!finalCompanyId) {
      throw new Error('Company ID is required');
    }
    return this.referralService.getReferralStats(finalCompanyId);
  }

  @Delete('codes/:codeId')
  @ApiOperation({ summary: 'Deactivate a referral code' })
  @ApiResponse({ status: 200, description: 'Referral code deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Referral code not found' })
  async deactivateReferralCode(
    @Request() req: any,
    @Param('codeId') codeId: string,
  ): Promise<{ message: string }> {
    const companyId = req.user.companyId || req.user.sub;
    await this.referralService.deactivateReferralCode(companyId, codeId);
    return { message: 'Referral code deactivated successfully' };
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate a referral code (public endpoint)' })
  @ApiResponse({ status: 200, description: 'Referral code validation result' })
  async validateReferralCode(
    @Body() body: { code: string },
  ): Promise<{ isValid: boolean; message?: string }> {
    const result = await this.referralService.useReferralCode(body.code, 'temp-validation');
    return {
      isValid: result.isValid,
      message: result.message,
    };
  }
}
