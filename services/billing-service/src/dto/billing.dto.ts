import { IsString, IsNotEmpty, IsNumber, IsPositive, IsOptional, IsEnum, IsObject, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType, TransactionStatus } from '../types/billing.types';

/**
 * DTO для получения баланса пользователя
 */
export class GetBalanceDto {
  @ApiProperty({ description: 'ID пользователя', example: 'user123' })
  @IsString()
  @IsNotEmpty()
  userId: string;
}

/**
 * DTO для обновления баланса
 */
export class UpdateBalanceDto {
  @ApiProperty({ description: 'ID пользователя', example: 'user123' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Сумма для изменения', example: 100.50 })
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  @Max(1000000)
  @Transform(({ value }) => parseFloat(value))
  amount: number;

  @ApiProperty({ 
    description: 'Операция с балансом', 
    enum: ['add', 'subtract'],
    example: 'add'
  })
  @IsEnum(['add', 'subtract'])
  operation: 'add' | 'subtract';

  @ApiPropertyOptional({ description: 'Описание операции', example: 'Пополнение баланса' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Ссылка на операцию', example: 'ref123' })
  @IsOptional()
  @IsString()
  reference?: string;
}

/**
 * DTO для создания транзакции
 */
export class CreateTransactionDto {
  @ApiProperty({ description: 'ID пользователя', example: 'user123' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ 
    description: 'Тип транзакции', 
    enum: TransactionType,
    example: TransactionType.CREDIT
  })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ description: 'Сумма транзакции', example: 100.50 })
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  @Max(1000000)
  @Transform(({ value }) => parseFloat(value))
  amount: number;

  @ApiPropertyOptional({ description: 'Валюта', example: 'USD', default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Описание транзакции', example: 'Пополнение баланса' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Ссылка на операцию', example: 'ref123' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ description: 'Метаданные', example: { source: 'api' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'ID способа оплаты', example: 'pm123' })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;
}

/**
 * DTO для отслеживания использования
 */
export class TrackUsageDto {
  @ApiProperty({ description: 'ID пользователя', example: 'user123' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Сервис', example: 'ai-chat' })
  @IsString()
  @IsNotEmpty()
  service: string;

  @ApiProperty({ description: 'Ресурс', example: 'gpt-4' })
  @IsString()
  @IsNotEmpty()
  resource: string;

  @ApiPropertyOptional({ description: 'Количество', example: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Max(10000)
  @Transform(({ value }) => parseInt(value))
  quantity?: number;

  @ApiPropertyOptional({ description: 'Единица измерения', example: 'request', default: 'request' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: 'Метаданные', example: { model: 'gpt-4' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * DTO для расчета стоимости
 */
export class CalculateCostDto {
  @ApiProperty({ description: 'ID пользователя', example: 'user123' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Сервис', example: 'ai-chat' })
  @IsString()
  @IsNotEmpty()
  service: string;

  @ApiProperty({ description: 'Ресурс', example: 'gpt-4' })
  @IsString()
  @IsNotEmpty()
  resource: string;

  @ApiProperty({ description: 'Количество', example: 1 })
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Max(10000)
  @Transform(({ value }) => parseInt(value))
  quantity: number;

  @ApiPropertyOptional({ description: 'Метаданные', example: { model: 'gpt-4' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * DTO для обработки платежа
 */
export class ProcessPaymentDto {
  @ApiProperty({ description: 'ID пользователя', example: 'user123' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Сумма платежа', example: 100.50 })
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  @Max(1000000)
  @Transform(({ value }) => parseFloat(value))
  amount: number;

  @ApiPropertyOptional({ description: 'Валюта', example: 'USD', default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'ID способа оплаты', example: 'pm123' })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @ApiPropertyOptional({ description: 'Описание платежа', example: 'Пополнение баланса' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Метаданные', example: { source: 'web' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * DTO для получения отчета по биллингу
 */
export class BillingReportDto {
  @ApiProperty({ description: 'ID пользователя', example: 'user123' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Дата начала периода', example: '2024-01-01' })
  @IsString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ description: 'Дата окончания периода', example: '2024-01-31' })
  @IsString()
  @IsNotEmpty()
  endDate: string;
}
