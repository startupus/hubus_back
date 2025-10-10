import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsArray, IsDateString, MinLength, MaxLength } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({ description: 'API key name', example: 'Production API Key' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'API key description', example: 'API key for production environment' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'API key permissions', example: ['read', 'write'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiPropertyOptional({ description: 'API key expiration date', example: '2024-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'API key metadata', example: { environment: 'production' } })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateApiKeyDto {
  @ApiPropertyOptional({ description: 'API key name', example: 'Updated API Key' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'API key description', example: 'Updated API key description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'API key permissions', example: ['read', 'write', 'admin'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiPropertyOptional({ description: 'API key expiration date', example: '2024-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'API key active status', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'API key metadata', example: { environment: 'staging' } })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ApiKeyResponseDto {
  @ApiProperty({ description: 'API key ID' })
  id: string;

  @ApiProperty({ description: 'API key value (only shown on creation)' })
  key?: string;

  @ApiProperty({ description: 'API key name' })
  name: string;

  @ApiPropertyOptional({ description: 'API key description' })
  description?: string;

  @ApiProperty({ description: 'API key active status' })
  isActive: boolean;

  @ApiProperty({ description: 'API key permissions' })
  permissions: string[];

  @ApiPropertyOptional({ description: 'Last used date' })
  lastUsedAt?: Date;

  @ApiPropertyOptional({ description: 'Expiration date' })
  expiresAt?: Date;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'API key metadata' })
  metadata?: Record<string, any>;
}
