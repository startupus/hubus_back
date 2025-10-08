export declare enum ChatModel {
    GPT_3_5_TURBO = "gpt-3.5-turbo",
    GPT_4 = "gpt-4",
    GPT_4_TURBO = "gpt-4-turbo-preview",
    CLAUDE_3_HAIKU = "claude-3-haiku-20240307",
    CLAUDE_3_SONNET = "claude-3-sonnet-20240229",
    CLAUDE_3_OPUS = "claude-3-opus-20240307",
    YANDEX_GPT = "yandexgpt",
    YANDEX_GPT_LITE = "yandexgpt-lite"
}
export declare enum ChatRole {
    SYSTEM = "system",
    USER = "user",
    ASSISTANT = "assistant"
}
export declare class ChatMessage {
    role: string;
    content: string;
    name?: string;
}
export declare class ChatCompletionRequest {
    model: string;
    messages: ChatMessage[];
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    provider?: 'openai' | 'openrouter' | 'anthropic' | 'yandex';
}
export declare class ChatCompletionChoice {
    index: number;
    message: ChatMessage;
    finish_reason: string;
}
export declare class ChatCompletionUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}
export declare class ChatCompletionResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: ChatCompletionChoice[];
    usage: ChatCompletionUsage;
    provider: string;
    processing_time_ms: number;
}
export declare class AnonymizedChatRequest {
    request: ChatCompletionRequest;
    anonymization_mapping: Record<string, string>;
    data_hash: string;
}
export declare class AnonymizedChatResponse {
    response: ChatCompletionResponse;
    anonymization_mapping: Record<string, string>;
    data_hash: string;
}
//# sourceMappingURL=chat.dto.d.ts.map