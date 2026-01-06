import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Audio Transcription Request DTO
 * Note: file is handled as multipart/form-data, not in DTO
 */
export class AudioTranscriptionRequest {
  @ApiProperty({ 
    description: 'Модель для транскрибации',
    example: 'whisper-1'
  })
  @IsString()
  @IsNotEmpty()
  model!: string;

  @ApiProperty({ 
    description: 'Код языка (опционально)',
    example: 'ru',
    required: false
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({ 
    description: 'Подсказка для улучшения точности (опционально)',
    required: false
  })
  @IsOptional()
  @IsString()
  prompt?: string;

  @ApiProperty({ 
    description: 'Температура (0.0 - 1.0)',
    example: 0,
    required: false
  })
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @ApiProperty({ 
    description: 'Формат ответа',
    enum: ['json', 'text', 'srt', 'verbose_json', 'vtt'],
    example: 'verbose_json',
    required: false
  })
  @IsOptional()
  @IsEnum(['json', 'text', 'srt', 'verbose_json', 'vtt'])
  response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
}

/**
 * Audio Transcription Segment DTO
 */
export class AudioTranscriptionSegment {
  @ApiProperty({ description: 'ID сегмента' })
  id!: number;

  @ApiProperty({ description: 'Позиция начала в файле' })
  seek!: number;

  @ApiProperty({ description: 'Время начала (секунды)' })
  start!: number;

  @ApiProperty({ description: 'Время окончания (секунды)' })
  end!: number;

  @ApiProperty({ description: 'Текст сегмента' })
  text!: string;

  @ApiProperty({ description: 'Токены (опционально)', required: false })
  tokens?: number[];

  @ApiProperty({ description: 'Температура (опционально)', required: false })
  temperature?: number;

  @ApiProperty({ description: 'Средний логарифм вероятности (опционально)', required: false })
  avg_logprob?: number;

  @ApiProperty({ description: 'Коэффициент сжатия (опционально)', required: false })
  compression_ratio?: number;

  @ApiProperty({ description: 'Вероятность отсутствия речи (опционально)', required: false })
  no_speech_prob?: number;
}

/**
 * Audio Transcription Response DTO (verbose_json format)
 */
export class AudioTranscriptionResponse {
  @ApiProperty({ description: 'Полный транскрибированный текст' })
  text!: string;

  @ApiProperty({ description: 'Определенный язык', required: false })
  language?: string;

  @ApiProperty({ description: 'Длительность в секундах', required: false })
  duration?: number;

  @ApiProperty({ 
    description: 'Сегменты транскрипции',
    type: [AudioTranscriptionSegment],
    required: false
  })
  segments?: AudioTranscriptionSegment[];
}

