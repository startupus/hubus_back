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
  // @ApiProperty({ 
    description: 'Text to anonymize (if not using messages)',
    required: false 
  })
  @IsOptional()
  @IsString()
  text?: string;

  // @ApiProperty({ 
    description: 'Chat messages to anonymize (if not using text)',
    type: [ChatMessageDto],
    required: false 
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages?: ChatMessageDto[];

  // @ApiProperty({ 
    description: 'User ID for settings lookup',
    required: false 
  })
  @IsOptional()
  @IsString()
  userId?: string;
}

export class AnonymizeResponseDto {
  // @ApiProperty({ description: 'Anonymized text (if text was provided)' })
  @IsOptional()
  @IsString()
  anonymizedText?: string;

  // @ApiProperty({ 
    description: 'Anonymized messages (if messages were provided)',
    type: [ChatMessageDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  anonymizedMessages?: ChatMessageDto[];

  // @ApiProperty({ 
    description: 'Mapping of original values to anonymized values',
    example: { 'john@example.com': 'user1@example.com', 'John Doe': '[ОБЕЗЛИЧЕНО_1]' }
  })
  @IsObject()
  mapping: Record<string, string>;
}

export class DeanonymizeRequestDto {
  // @ApiProperty({ 
    description: 'Text to deanonymize (if not using messages)',
    required: false 
  })
  @IsOptional()
  @IsString()
  text?: string;

  // @ApiProperty({ 
    description: 'Chat messages to deanonymize (if not using text)',
    type: [ChatMessageDto],
    required: false 
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages?: ChatMessageDto[];

  // @ApiProperty({ 
    description: 'Mapping of anonymized values to original values',
    example: { 'user1@example.com': 'john@example.com', '[ОБЕЗЛИЧЕНО_1]': 'John Doe' }
  })
  @IsObject()
  mapping: Record<string, string>;
}

export class DeanonymizeResponseDto {
  // @ApiProperty({ description: 'Deanonymized text (if text was provided)' })
  @IsOptional()
  @IsString()
  deanonymizedText?: string;

  // @ApiProperty({ 
    description: 'Deanonymized messages (if messages were provided)',
    type: [ChatMessageDto]
  })
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
