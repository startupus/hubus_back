import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ProviderRequestDto, ProviderResponseDto } from '@ai-aggregator/shared';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('completions')
  @ApiOperation({ summary: 'Create chat completion' })
  @ApiResponse({ status: 200, description: 'Chat completion created successfully', type: ProviderResponseDto })
  async createCompletion(@Body() requestDto: ProviderRequestDto) {
    return this.chatService.createCompletion(requestDto);
  }
}

