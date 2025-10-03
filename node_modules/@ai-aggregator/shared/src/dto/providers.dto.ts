/**
 * Provider DTOs
 */

export class ChatMessageDto {
  role: 'user' | 'assistant' | 'system';
  content: string;
  name?: string;
}

export class ProviderRequestDto {
  model: string;
  messages: ChatMessageDto[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string;
  stream?: boolean;
  user?: string;
}

export class ProviderResponseDto {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessageDto;
    finish_reason: 'stop' | 'length' | 'content_filter' | 'null';
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class ModelInfoDto {
  id: string;
  name: string;
  description?: string;
  contextLength: number;
  inputCostPerToken: number;
  outputCostPerToken: number;
  supportedFeatures: string[];
  provider: string;
}

export class ProviderConfigDto {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export class CostCalculationDto {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: string;
}