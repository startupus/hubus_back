import { Injectable } from '@nestjs/common';
import { ProviderRequestDto, ProviderResponseDto } from '@ai-aggregator/shared';

@Injectable()
export class ChatService {
  async createCompletion(requestDto: ProviderRequestDto): Promise<ProviderResponseDto> {
    // TODO: Implement chat completion logic
    return {
      id: 'mock-id',
      object: 'chat.completion',
      created: Date.now(),
      model: requestDto.model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: 'Mock response',
        },
        finish_reason: 'stop',
      }],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 5,
        total_tokens: 15,
      },
    };
  }
}

