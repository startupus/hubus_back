"use strict";
/**
 * Provider DTOs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CostCalculationDto = exports.ProviderConfigDto = exports.ModelInfoDto = exports.ProviderResponseDto = exports.ProviderRequestDto = exports.ChatMessageDto = void 0;
class ChatMessageDto {
    role;
    content;
    name;
}
exports.ChatMessageDto = ChatMessageDto;
class ProviderRequestDto {
    model;
    messages;
    max_tokens;
    temperature;
    top_p;
    frequency_penalty;
    presence_penalty;
    stop;
    stream;
    user;
}
exports.ProviderRequestDto = ProviderRequestDto;
class ProviderResponseDto {
    id;
    object;
    created;
    model;
    choices;
    usage;
}
exports.ProviderResponseDto = ProviderResponseDto;
class ModelInfoDto {
    id;
    name;
    description;
    contextLength;
    inputCostPerToken;
    outputCostPerToken;
    supportedFeatures;
    provider;
}
exports.ModelInfoDto = ModelInfoDto;
class ProviderConfigDto {
    apiKey;
    baseUrl;
    timeout;
    maxRetries;
    retryDelay;
}
exports.ProviderConfigDto = ProviderConfigDto;
class CostCalculationDto {
    provider;
    model;
    inputTokens;
    outputTokens;
    inputCost;
    outputCost;
    totalCost;
    currency;
}
exports.CostCalculationDto = CostCalculationDto;
//# sourceMappingURL=providers.dto.js.map