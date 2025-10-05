import { IsString, IsOptional, IsEnum, IsArray, IsNumber, IsBoolean, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { 
  AICategory, 
  AICertificationLevel, 
  AICertificationStatus,
  AISafetyLevel,
  RiskFactorCategory
} from '../types/ai-certification';

export class AIClassificationRequestDto {
  @ApiProperty({ description: 'Model ID' })
  @IsString()
  modelId: string;

  @ApiProperty({ description: 'Provider name' })
  @IsString()
  provider: string;

  @ApiProperty({ description: 'Model name' })
  @IsString()
  modelName: string;

  @ApiProperty({ description: 'Model description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Model capabilities', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  capabilities?: string[];

  @ApiProperty({ description: 'Test data', required: false })
  @IsOptional()
  @IsObject()
  testData?: any;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class AIClassificationResponseDto {
  @ApiProperty({ description: 'Success status' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'Classification result', required: false })
  @IsOptional()
  @IsObject()
  classification?: any;

  @ApiProperty({ description: 'Error messages', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  errors?: string[];

  @ApiProperty({ description: 'Warning messages', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  warnings?: string[];

  @ApiProperty({ description: 'Recommendations', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recommendations?: string[];
}

export class CertificationRequestDto {
  @ApiProperty({ description: 'Model ID' })
  @IsString()
  modelId: string;

  @ApiProperty({ description: 'Provider name' })
  @IsString()
  provider: string;

  @ApiProperty({ description: 'Model name' })
  @IsString()
  modelName: string;

  @ApiProperty({ description: 'Requested certification level', enum: AICertificationLevel })
  @IsEnum(AICertificationLevel)
  requestedLevel: AICertificationLevel;

  @ApiProperty({ description: 'Test data', required: false })
  @IsOptional()
  @IsObject()
  testData?: any;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CertificationResponseDto {
  @ApiProperty({ description: 'Success status' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'Certification result', required: false })
  @IsOptional()
  @IsObject()
  certification?: any;

  @ApiProperty({ description: 'Error messages', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  errors?: string[];

  @ApiProperty({ description: 'Warning messages', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  warnings?: string[];

  @ApiProperty({ description: 'Recommendations', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recommendations?: string[];
}

export class SafetyTestRequestDto {
  @ApiProperty({ description: 'Model ID' })
  @IsString()
  modelId: string;

  @ApiProperty({ description: 'Test type', enum: ['comprehensive', 'quick', 'targeted'] })
  @IsEnum(['comprehensive', 'quick', 'targeted'])
  testType: 'comprehensive' | 'quick' | 'targeted';

  @ApiProperty({ description: 'Test data', required: false })
  @IsOptional()
  @IsObject()
  testData?: any;

  @ApiProperty({ description: 'Focus areas', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsEnum(RiskFactorCategory, { each: true })
  focusAreas?: RiskFactorCategory[];
}

export class SafetyTestResponseDto {
  @ApiProperty({ description: 'Success status' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'Safety assessment', required: false })
  @IsOptional()
  @IsObject()
  assessment?: any;

  @ApiProperty({ description: 'Error messages', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  errors?: string[];

  @ApiProperty({ description: 'Warning messages', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  warnings?: string[];

  @ApiProperty({ description: 'Recommendations', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recommendations?: string[];
}

export class SafetyIncidentDto {
  @ApiProperty({ description: 'Model ID' })
  @IsString()
  modelId: string;

  @ApiProperty({ description: 'Incident type' })
  @IsString()
  incidentType: string;

  @ApiProperty({ description: 'Incident description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Severity level', enum: ['low', 'medium', 'high', 'critical'] })
  @IsEnum(['low', 'medium', 'high', 'critical'])
  severity: 'low' | 'medium' | 'high' | 'critical';

  @ApiProperty({ description: 'Occurred at' })
  @IsString()
  occurredAt: string;

  @ApiProperty({ description: 'Resolution description', required: false })
  @IsOptional()
  @IsString()
  resolution?: string;

  @ApiProperty({ description: 'Reported by' })
  @IsString()
  reportedBy: string;

  @ApiProperty({ description: 'Number of affected users' })
  @IsNumber()
  affectedUsers: number;
}

export class RevokeCertificationDto {
  @ApiProperty({ description: 'Revocation reason' })
  @IsString()
  reason: string;
}

export class CategoryInfoDto {
  @ApiProperty({ description: 'Category name', enum: AICategory })
  @IsEnum(AICategory)
  category: AICategory;

  @ApiProperty({ description: 'Category description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Use cases', type: [String] })
  @IsArray()
  @IsString({ each: true })
  useCases: string[];
}

export class CertificationLevelInfoDto {
  @ApiProperty({ description: 'Certification level', enum: AICertificationLevel })
  @IsEnum(AICertificationLevel)
  level: AICertificationLevel;

  @ApiProperty({ description: 'Minimum score required' })
  @IsNumber()
  minScore: number;

  @ApiProperty({ description: 'Minimum pass rate required' })
  @IsNumber()
  minPassRate: number;

  @ApiProperty({ description: 'Required tests', type: [String] })
  @IsArray()
  @IsString({ each: true })
  requiredTests: string[];

  @ApiProperty({ description: 'Compliance standards', type: [String] })
  @IsArray()
  @IsString({ each: true })
  complianceStandards: string[];
}

export class SafetyLevelInfoDto {
  @ApiProperty({ description: 'Safety level', enum: AISafetyLevel })
  @IsEnum(AISafetyLevel)
  level: AISafetyLevel;

  @ApiProperty({ description: 'Level description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Requirements', type: [String] })
  @IsArray()
  @IsString({ each: true })
  requirements: string[];

  @ApiProperty({ description: 'Restrictions', type: [String] })
  @IsArray()
  @IsString({ each: true })
  restrictions: string[];
}

export class SafetyStatisticsDto {
  @ApiProperty({ description: 'Total incidents' })
  @IsNumber()
  totalIncidents: number;

  @ApiProperty({ description: 'Critical incidents' })
  @IsNumber()
  criticalIncidents: number;

  @ApiProperty({ description: 'Resolved incidents' })
  @IsNumber()
  resolvedIncidents: number;

  @ApiProperty({ description: 'Average resolution time in milliseconds' })
  @IsNumber()
  averageResolutionTime: number;
}