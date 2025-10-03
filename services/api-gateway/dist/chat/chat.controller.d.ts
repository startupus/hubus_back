import { ChatService } from './chat.service';
import { ProviderRequestDto, ProviderResponseDto } from '@ai-aggregator/shared';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    createCompletion(requestDto: ProviderRequestDto): Promise<ProviderResponseDto>;
}
