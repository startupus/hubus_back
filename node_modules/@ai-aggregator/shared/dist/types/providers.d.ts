/**
 * Base types for AI providers
 */
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    name?: string;
}
export interface ProviderRequest {
    model: string;
    messages: ChatMessage[];
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    stop?: string | string[];
    stream?: boolean;
    user?: string;
}
export interface ProviderResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: ChatMessage;
        finish_reason: 'stop' | 'length' | 'content_filter' | 'null';
    }>;
    usage: TokenUsage;
}
export interface TokenUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}
export interface ProviderConfig {
    apiKey: string;
    baseUrl: string;
    timeout?: number;
    maxRetries?: number;
    retryDelay?: number;
}
export interface ProviderModel {
    id: string;
    name: string;
    description?: string;
    contextLength: number;
    inputCostPerToken: number;
    outputCostPerToken: number;
    supportedFeatures: string[];
    provider: string;
}
export interface ProviderCapabilities {
    supportsStreaming: boolean;
    supportsFunctionCalling: boolean;
    supportsVision: boolean;
    supportsEmbeddings: boolean;
    maxTokensPerRequest: number;
    supportedModels: string[];
}
export type ProviderType = 'openai' | 'openrouter' | 'anthropic' | 'google' | 'cohere';
export interface ProviderMetadata {
    type: ProviderType;
    name: string;
    version: string;
    capabilities: ProviderCapabilities;
    rateLimits: {
        requestsPerMinute: number;
        tokensPerMinute: number;
    };
}
//# sourceMappingURL=providers.d.ts.map