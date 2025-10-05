import { IsArray, IsString, IsOptional, IsNumber, IsEnum, ValidateNested, IsObject } from 'class-validator';
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

export class ChatMessage {
  @ApiProperty({ description: 'Роль отправителя сообщения' })
  role: string;

  @ApiProperty({ description: 'Содержимое сообщения' })
  content: string;

  @ApiProperty({ description: 'Имя отправителя (опционально)', required: false })
  @IsOptional()
  name?: string;
}

export class ChatCompletionRequest {
  @ApiProperty({ description: 'Модель для использования' })
  model: string;

  @ApiProperty({ description: 'Массив сообщений', type: [ChatMessage] })
  messages: ChatMessage[];

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
  index: number;

  @ApiProperty({ description: 'Сообщение ответа', type: ChatMessage })
  @ValidateNested()
  @Type(() => ChatMessage)
  message: ChatMessage;

  @ApiProperty({ description: 'Причина завершения' })
  finish_reason: string;
}

export class ChatCompletionUsage {
  @ApiProperty({ description: 'Количество токенов в промпте' })
  prompt_tokens: number;

  @ApiProperty({ description: 'Количество токенов в ответе' })
  completion_tokens: number;

  @ApiProperty({ description: 'Общее количество токенов' })
  total_tokens: number;
}

export class ChatCompletionResponse {
  @ApiProperty({ description: 'ID ответа' })
  id: string;

  @ApiProperty({ description: 'Объект ответа' })
  object: string;

  @ApiProperty({ description: 'Время создания' })
  created: number;

  @ApiProperty({ description: 'Модель' })
  model: string;

  @ApiProperty({ description: 'Массив выборов', type: [ChatCompletionChoice] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatCompletionChoice)
  choices: ChatCompletionChoice[];

  @ApiProperty({ description: 'Использование токенов', type: ChatCompletionUsage })
  @ValidateNested()
  @Type(() => ChatCompletionUsage)
  usage: ChatCompletionUsage;

  @ApiProperty({ description: 'Провайдер, который обработал запрос' })
  provider: string;

  @ApiProperty({ description: 'Время обработки в миллисекундах' })
  processing_time_ms: number;
}

export class AnonymizedChatRequest {
  @ApiProperty({ description: 'Обезличенный запрос' })
  @ValidateNested()
  @Type(() => ChatCompletionRequest)
  request: ChatCompletionRequest;

  @ApiProperty({ description: 'Маппинг обезличивания' })
  @IsObject()
  anonymization_mapping: Record<string, string>;

  @ApiProperty({ description: 'Хеш данных для отслеживания' })
  @IsString()
  data_hash: string;
}

export class AnonymizedChatResponse {
  @ApiProperty({ description: 'Обезличенный ответ' })
  @ValidateNested()
  @Type(() => ChatCompletionResponse)
  response: ChatCompletionResponse;

  @ApiProperty({ description: 'Маппинг обезличивания' })
  @IsObject()
  anonymization_mapping: Record<string, string>;

  @ApiProperty({ description: 'Хеш данных для отслеживания' })
  @IsString()
  data_hash: string;
}
