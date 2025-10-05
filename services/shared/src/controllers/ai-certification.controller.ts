import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { 
  AICertification, 
  AICertificationLevel,
  AICertificationStatus
} from '../types/ai-certification';
import { AICertificationService, CertificationRequest, CertificationResponse } from '../services/ai-certification.service';

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
    return {
      levels: Object.values(AICertificationLevel)
    };
  }

  @Get('statuses')
  @ApiOperation({ summary: 'Get available certification statuses' })
  @ApiResponse({ status: 200, description: 'Certification statuses retrieved successfully' })
  async getCertificationStatuses(): Promise<{ statuses: AICertificationStatus[] }> {
    return {
      statuses: Object.values(AICertificationStatus)
    };
  }

  @Get('models/:modelId')
  @ApiOperation({ summary: 'Get model certification' })
  @ApiParam({ name: 'modelId', description: 'Model ID' })
  @ApiResponse({ status: 200, description: 'Certification retrieved successfully' })
  async getModelCertification(@Param('modelId') modelId: string): Promise<AICertification | null> {
    return this.certificationService.getCertification(modelId);
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
    const allCertifications = await this.certificationService.getAllCertifications();
    
    let filtered = allCertifications;
    
    if (status) {
      filtered = filtered.filter(cert => cert.status === status);
    }
    
    if (level) {
      filtered = filtered.filter(cert => cert.certificationLevel === level);
    }

    return { certifications: filtered };
  }

  @Post('revoke/:modelId')
  @ApiOperation({ summary: 'Revoke model certification' })
  @ApiParam({ name: 'modelId', description: 'Model ID' })
  @ApiResponse({ status: 200, description: 'Certification revoked successfully' })
  async revokeCertification(
    @Param('modelId') modelId: string,
    @Body() body: { reason: string }
  ): Promise<{ success: boolean; message: string }> {
    const success = await this.certificationService.revokeCertification(modelId, body.reason);
    
    return {
      success,
      message: success ? 'Certification revoked successfully' : 'Failed to revoke certification'
    };
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
    const requirements = this.getRequirementsForLevel(level);
    
    return {
      level,
      requirements
    };
  }

  private getRequirementsForLevel(level: AICertificationLevel): {
    minScore: number;
    minPassRate: number;
    requiredTests: string[];
    complianceStandards: string[];
  } {
    const requirements = {
      [AICertificationLevel.BASIC]: {
        minScore: 70,
        minPassRate: 0.7,
        requiredTests: ['Performance Test', 'Basic Safety Test'],
        complianceStandards: []
      },
      [AICertificationLevel.STANDARD]: {
        minScore: 80,
        minPassRate: 0.8,
        requiredTests: ['Performance Test', 'Safety Test', 'Bias Test', 'GDPR Compliance'],
        complianceStandards: ['GDPR']
      },
      [AICertificationLevel.PREMIUM]: {
        minScore: 85,
        minPassRate: 0.85,
        requiredTests: ['Performance Test', 'Safety Test', 'Bias Test', 'Security Test', 'GDPR Compliance'],
        complianceStandards: ['GDPR', 'CCPA']
      },
      [AICertificationLevel.ENTERPRISE]: {
        minScore: 90,
        minPassRate: 0.9,
        requiredTests: ['Performance Test', 'Safety Test', 'Bias Test', 'Security Test', 'GDPR Compliance', 'HIPAA Compliance'],
        complianceStandards: ['GDPR', 'CCPA', 'HIPAA', 'SOX']
      },
      [AICertificationLevel.GOVERNMENT]: {
        minScore: 95,
        minPassRate: 0.95,
        requiredTests: ['Performance Test', 'Safety Test', 'Bias Test', 'Security Test', 'GDPR Compliance', 'HIPAA Compliance', 'ISO 27001 Compliance'],
        complianceStandards: ['GDPR', 'CCPA', 'HIPAA', 'SOX', 'ISO 27001', 'SOC 2']
      },
      [AICertificationLevel.UNVERIFIED]: {
        minScore: 0,
        minPassRate: 0,
        requiredTests: [],
        complianceStandards: []
      }
    };

    return requirements[level] || requirements[AICertificationLevel.BASIC];
  }
}
