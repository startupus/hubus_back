import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { 
  AICertification, 
  AICertificationLevel,
  AICertificationStatus
} from '@ai-aggregator/shared';
import { AICertificationService, CertificationRequest, CertificationResponse } from './ai-certification.service';

@ApiTags('AI Certification')
@Controller('ai/certification')
export class AICertificationController {
  constructor(private readonly certificationService: AICertificationService) {}

  @Post('submit')
  @ApiOperation({ summary: 'Submit certification request' })
  @ApiResponse({ status: 200, description: 'Certification request submitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async submitCertificationRequest(@Body() request: CertificationRequest): Promise<CertificationResponse> {
    return this.certificationService.submitCertificationRequest(request);
  }

  @Get('levels')
  @ApiOperation({ summary: 'Get available certification levels' })
  @ApiResponse({ status: 200, description: 'Certification levels retrieved successfully' })
  async getCertificationLevels(): Promise<{ levels: AICertificationLevel[] }> {
    return this.certificationService.getCertificationLevels();
  }

  @Get('statuses')
  @ApiOperation({ summary: 'Get available certification statuses' })
  @ApiResponse({ status: 200, description: 'Certification statuses retrieved successfully' })
  async getCertificationStatuses(): Promise<{ statuses: AICertificationStatus[] }> {
    return this.certificationService.getCertificationStatuses();
  }

  @Get('models/:modelId')
  @ApiOperation({ summary: 'Get model certification' })
  @ApiParam({ name: 'modelId', description: 'Model ID' })
  @ApiResponse({ status: 200, description: 'Certification retrieved successfully' })
  async getModelCertification(@Param('modelId') modelId: string): Promise<AICertification | null> {
    return this.certificationService.getModelCertification(modelId);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all certifications' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'level', required: false, description: 'Filter by level' })
  @ApiResponse({ status: 200, description: 'Certifications retrieved successfully' })
  async getAllCertifications(
    @Query('status') status?: AICertificationStatus,
    @Query('level') level?: AICertificationLevel
  ): Promise<{ certifications: AICertification[] }> {
    return this.certificationService.getAllCertifications(status, level);
  }

  @Post('revoke/:modelId')
  @ApiOperation({ summary: 'Revoke model certification' })
  @ApiParam({ name: 'modelId', description: 'Model ID' })
  @ApiResponse({ status: 200, description: 'Certification revoked successfully' })
  async revokeCertification(
    @Param('modelId') modelId: string,
    @Body() body: { reason: string }
  ): Promise<{ success: boolean; message: string }> {
    return this.certificationService.revokeCertification(modelId, body.reason);
  }

  @Get('levels/:level/requirements')
  @ApiOperation({ summary: 'Get certification level requirements' })
  @ApiParam({ name: 'level', description: 'Certification level' })
  @ApiResponse({ status: 200, description: 'Requirements retrieved successfully' })
  async getLevelRequirements(@Param('level') level: AICertificationLevel): Promise<{
    level: AICertificationLevel;
    requirements: {
      minScore: number;
      minPassRate: number;
      requiredTests: string[];
      complianceStandards: string[];
    };
  }> {
    return this.certificationService.getLevelRequirements(level);
  }
}
