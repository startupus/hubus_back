// import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, IsBoolean, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ChatMessageDto {
  // @ApiProperty({ description: 'Message role (user, assistant, system)' })
  @IsString()
  role: string;

  // @ApiProperty({ description: 'Message content' })
  @IsString()
  content: string;
}

export class AnonymizeRequestDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages?: ChatMessageDto[];

  @IsOptional()
  @IsString()
  userId?: string;
}

export class AnonymizeResponseDto {
  @IsOptional()
  @IsString()
  anonymizedText?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  anonymizedMessages?: ChatMessageDto[];

  @IsObject()
  mapping: Record<string, string>;
}

export class DeanonymizeRequestDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages?: ChatMessageDto[];

  @IsObject()
  mapping: Record<string, string>;
}

export class DeanonymizeResponseDto {
  @IsOptional()
  @IsString()
  deanonymizedText?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  deanonymizedMessages?: ChatMessageDto[];
}

export class AnonymizationSettingsDto {
  // @ApiProperty({ description: 'Enable anonymization' })
  @IsBoolean()
  enabled: boolean;

  // @ApiProperty({ description: 'Anonymize email addresses' })
  @IsBoolean()
  anonymizeEmails: boolean;

  // @ApiProperty({ description: 'Anonymize phone numbers' })
  @IsBoolean()
  anonymizePhones: boolean;

  // @ApiProperty({ description: 'Anonymize names' })
  @IsBoolean()
  anonymizeNames: boolean;

  // @ApiProperty({ description: 'Anonymize addresses' })
  @IsBoolean()
  anonymizeAddresses: boolean;

  // @ApiProperty({ description: 'Anonymize personal numbers (INN, SNILS)' })
  @IsBoolean()
  anonymizePersonalNumbers: boolean;

  // @ApiProperty({ description: 'Anonymize IP addresses' })
  @IsBoolean()
  anonymizeIPs: boolean;

  // @ApiProperty({ description: 'Anonymize URLs' })
  @IsBoolean()
  anonymizeURLs: boolean;

  // @ApiProperty({ description: 'Custom patterns for anonymization' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  customPatterns?: string[];
}

export class AnonymizationSettingsResponseDto extends AnonymizationSettingsDto {
  // @ApiProperty({ description: 'User ID' })
  @IsString()
  userId: string;

  // @ApiProperty({ description: 'Settings creation timestamp' })
  @IsString()
  createdAt: string;

  // @ApiProperty({ description: 'Settings last update timestamp' })
  @IsString()
  updatedAt: string;
}
