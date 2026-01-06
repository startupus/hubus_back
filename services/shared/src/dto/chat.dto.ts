import { IsArray, IsString, IsOptional, IsNumber, IsEnum, ValidateNested, IsObject, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum ChatModel {
  GPT_3_5_TURBO = 'gpt-3.5-turbo',
  GPT_4 = 'gpt-4',
  GPT_4_TURBO = 'gpt-4-turbo-preview',
  CLAUDE_3_HAIKU = 'claude-3-haiku-20240307',
  CLAUDE_3_SONNET = 'claude-3-sonnet-20240229',
  CLAUDE_3_OPUS = 'claude-3-opus-20240307',
  YANDEX_GPT = 'yandexgpt',
  YANDEX_GPT_LITE = 'yandexgpt-lite',
}

export enum ChatRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
}

/**
 * Content item for Vision API (image_url)
 */
export class ImageUrlContent {
  @ApiProperty({ description: 'Тип контента', enum: ['image_url'] })
  @IsString()
  @IsNotEmpty()
  type!: 'image_url';

  @ApiProperty({ 
    description: 'URL изображения в формате data URL',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...'
  })
  @IsObject()
  image_url!: {
    url: string;
  };
}

/**
 * Audio content item (для GPT-4o Audio Preview, Voxtral)
 */
export class AudioContent {
  @ApiProperty({ description: 'Тип контента', enum: ['audio'] })
  @IsString()
  @IsNotEmpty()
  type!: 'audio';

  @ApiProperty({ 
    description: 'URL аудио в формате data URL',
    example: 'data:audio/mpeg;base64,...'
  })
  @IsObject()
  audio!: {
    url: string;
  };
}

/**
 * Video content item (для GPT-4o и других мультимодальных моделей)
 */
export class VideoContent {
  @ApiProperty({ description: 'Тип контента', enum: ['video'] })
  @IsString()
  @IsNotEmpty()
  type!: 'video';

  @ApiProperty({ 
    description: 'URL видео в формате data URL',
    example: 'data:video/mp4;base64,...'
  })
  @IsObject()
  video!: {
    url: string;
  };
}

/**
 * Text content item
 */
export class TextContent {
  @ApiProperty({ description: 'Тип контента', enum: ['text'] })
  @IsString()
  @IsNotEmpty()
  type!: 'text';

  @ApiProperty({ description: 'Текст сообщения' })
  @IsString()
  @IsNotEmpty()
  text!: string;
}

export class ChatMessage {
  @ApiProperty({ description: 'Роль отправителя сообщения' })
  @IsString()
  @IsNotEmpty()
  role!: string;

  @ApiProperty({ 
    description: 'Содержимое сообщения. Может быть строкой (обычный текст) или массивом объектов (для мультимодальных моделей). Поддерживаемые типы: "text", "image_url", "audio", "video". Для Vision API используйте type: "image_url", для аудио - type: "audio", для видео - type: "video"',
    oneOf: [
      { type: 'string' },
      { 
        type: 'array', 
        items: { 
          oneOf: [
            { $ref: '#/components/schemas/TextContent' },
            { $ref: '#/components/schemas/ImageUrlContent' },
            { $ref: '#/components/schemas/AudioContent' },
            { $ref: '#/components/schemas/VideoContent' }
          ]
        }
      }
    ],
    example: 'Текст сообщения'
  })
  // Для обратной совместимости content может быть строкой или массивом
  // Валидация будет более гибкой - не используем строгие декораторы
  // Поддерживаемые типы контента: text, image_url, audio, video
  content!: string | (TextContent | ImageUrlContent | AudioContent | VideoContent)[];

  @ApiProperty({ description: 'Имя отправителя (опционально)', required: false })
  @IsOptional()
  name?: string;
}

export class ChatCompletionRequest {
  @ApiProperty({ description: 'Модель для использования' })
  @IsString()
  @IsNotEmpty()
  model!: string;

  @ApiProperty({ description: 'Массив сообщений', type: [ChatMessage] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessage)
  @IsNotEmpty()
  messages!: ChatMessage[];

  @ApiProperty({ description: 'Максимальное количество токенов в ответе', required: false })
  @IsOptional()
  max_tokens?: number;

  @ApiProperty({ description: 'Температура генерации (0-2)', required: false })
  @IsOptional()
  temperature?: number;

  @ApiProperty({ description: 'Вероятность top_p (0-1)', required: false })
  @IsOptional()
  top_p?: number;

  @ApiProperty({ description: 'Частота штрафа (0-2)', required: false })
  @IsOptional()
  frequency_penalty?: number;

  @ApiProperty({ description: 'Штраф за присутствие (0-2)', required: false })
  @IsOptional()
  presence_penalty?: number;

  @ApiProperty({ description: 'Провайдер для использования', required: false })
  @IsOptional()
  provider?: 'openai' | 'openrouter' | 'anthropic' | 'yandex';
}

export class ChatCompletionChoice {
  @ApiProperty({ description: 'Индекс выбора' })
  index!: number;

  @ApiProperty({ description: 'Сообщение ответа', type: ChatMessage })
  @ValidateNested()
  @Type(() => ChatMessage)
  message!: ChatMessage;

  @ApiProperty({ description: 'Причина завершения' })
  finish_reason!: string;
}

export class ChatCompletionUsage {
  @ApiProperty({ description: 'Количество токенов в промпте' })
  prompt_tokens!: number;

  @ApiProperty({ description: 'Количество токенов в ответе' })
  completion_tokens!: number;

  @ApiProperty({ description: 'Общее количество токенов' })
  total_tokens!: number;
}

export class ChatCompletionResponse {
  @ApiProperty({ description: 'ID ответа' })
  id!: string;

  @ApiProperty({ description: 'Объект ответа' })
  object!: string;

  @ApiProperty({ description: 'Время создания' })
  created!: number;

  @ApiProperty({ description: 'Модель' })
  model!: string;

  @ApiProperty({ description: 'Массив выборов', type: [ChatCompletionChoice] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatCompletionChoice)
  choices!: ChatCompletionChoice[];

  @ApiProperty({ description: 'Использование токенов', type: ChatCompletionUsage })
  @ValidateNested()
  @Type(() => ChatCompletionUsage)
  usage!: ChatCompletionUsage;

  @ApiProperty({ description: 'Провайдер, который обработал запрос' })
  provider!: string;

  @ApiProperty({ description: 'Время обработки в миллисекундах' })
  processing_time_ms!: number;
}

export class AnonymizedChatRequest {
  @ApiProperty({ description: 'Обезличенный запрос' })
  @ValidateNested()
  @Type(() => ChatCompletionRequest)
  request!: ChatCompletionRequest;

  @ApiProperty({ description: 'Маппинг обезличивания' })
  @IsObject()
  anonymization_mapping!: Record<string, string>;

  @ApiProperty({ description: 'Хеш данных для отслеживания' })
  @IsString()
  data_hash!: string;
}

export class AnonymizedChatResponse {
  @ApiProperty({ description: 'Обезличенный ответ' })
  @ValidateNested()
  @Type(() => ChatCompletionResponse)
  response!: ChatCompletionResponse;

  @ApiProperty({ description: 'Маппинг обезличивания' })
  @IsObject()
  anonymization_mapping!: Record<string, string>;

  @ApiProperty({ description: 'Хеш данных для отслеживания' })
  @IsString()
  data_hash!: string;
}
