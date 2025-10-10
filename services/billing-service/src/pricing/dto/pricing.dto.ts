import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { PricingType, BillingCycle } from '@prisma/client';

export class CreatePricingPlanDto {
  @ApiProperty({ description: 'Plan name', example: 'Basic Plan' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Plan description', example: 'Basic plan with 10k input tokens' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Pricing type', enum: PricingType, example: PricingType.TOKEN_BASED })
  @IsEnum(PricingType)
  type: PricingType;

  @ApiPropertyOptional({ description: 'Plan price', example: 29.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  price?: number;

  @ApiPropertyOptional({ description: 'Currency', example: 'USD', default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Billing cycle', enum: BillingCycle, example: BillingCycle.MONTHLY })
  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @ApiPropertyOptional({ description: 'Is plan active', example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // Token-based plan fields
  @ApiPropertyOptional({ description: 'Included input tokens', example: 10000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  inputTokens?: number;

  @ApiPropertyOptional({ description: 'Included output tokens', example: 20000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  outputTokens?: number;

  @ApiPropertyOptional({ description: 'Input token price', example: 0.00003 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  inputTokenPrice?: number;

  @ApiPropertyOptional({ description: 'Output token price', example: 0.00006 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  outputTokenPrice?: number;

  @ApiPropertyOptional({ description: 'Discount percentage', example: 10.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  discountPercent?: number;
}

export class UpdatePricingPlanDto {
  @ApiPropertyOptional({ description: 'Plan name', example: 'Basic Plan' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Plan description', example: 'Basic plan with 10k input tokens' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Pricing type', enum: PricingType })
  @IsOptional()
  @IsEnum(PricingType)
  type?: PricingType;

  @ApiPropertyOptional({ description: 'Plan price', example: 29.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  price?: number;

  @ApiPropertyOptional({ description: 'Currency', example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Billing cycle', enum: BillingCycle })
  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @ApiPropertyOptional({ description: 'Is plan active', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // Token-based plan fields
  @ApiPropertyOptional({ description: 'Included input tokens', example: 10000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  inputTokens?: number;

  @ApiPropertyOptional({ description: 'Included output tokens', example: 20000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  outputTokens?: number;

  @ApiPropertyOptional({ description: 'Input token price', example: 0.00003 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  inputTokenPrice?: number;

  @ApiPropertyOptional({ description: 'Output token price', example: 0.00006 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  outputTokenPrice?: number;

  @ApiPropertyOptional({ description: 'Discount percentage', example: 10.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  discountPercent?: number;
}

export class SubscribeToPlanDto {
  @ApiProperty({ description: 'Company ID', example: 'uuid' })
  @IsString()
  companyId: string;

  @ApiProperty({ description: 'Pricing plan ID', example: 'uuid' })
  @IsString()
  planId: string;

  @ApiPropertyOptional({ description: 'Payment method ID', example: 'uuid' })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;
}

export class SubscriptionUsageDto {
  @ApiProperty({ description: 'Input tokens used', example: 5000 })
  inputTokensUsed: number;

  @ApiProperty({ description: 'Output tokens used', example: 10000 })
  outputTokensUsed: number;

  @ApiProperty({ description: 'Input tokens limit', example: 10000 })
  inputTokensLimit: number;

  @ApiProperty({ description: 'Output tokens limit', example: 20000 })
  outputTokensLimit: number;

  @ApiProperty({ description: 'Input tokens remaining', example: 5000 })
  inputTokensRemaining: number;

  @ApiProperty({ description: 'Output tokens remaining', example: 10000 })
  outputTokensRemaining: number;

  @ApiProperty({ description: 'Usage percentage', example: 50.0 })
  usagePercentage: number;
}
