import { ProviderRequestDto, ProviderResponseDto } from '@ai-aggregator/shared';
export declare class ChatService {
    createCompletion(requestDto: ProviderRequestDto): Promise<ProviderResponseDto>;
}
