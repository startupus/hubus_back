export interface RequestHistory {
    id: string;
    userId: string;
    sessionId?: string;
    requestType: RequestType;
    provider: string;
    model: string;
    requestData: Record<string, any>;
    responseData?: Record<string, any>;
    tokensUsed?: number;
    cost?: number;
    responseTime?: number;
    status: RequestStatus;
    errorMessage?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum RequestType {
    CHAT_COMPLETION = "chat_completion",
    IMAGE_GENERATION = "image_generation",
    EMBEDDING = "embedding",
    MODERATION = "moderation",
    TRANSCRIPTION = "transcription",
    TRANSLATION = "translation"
}
export declare enum RequestStatus {
    SUCCESS = "success",
    ERROR = "error",
    TIMEOUT = "timeout",
    CANCELLED = "cancelled",
    RATE_LIMITED = "rate_limited"
}
export interface CreateRequestHistoryDto {
    userId: string;
    sessionId?: string;
    requestType: RequestType;
    provider: string;
    model: string;
    requestData: Record<string, any>;
    responseData?: Record<string, any>;
    tokensUsed?: number;
    cost?: number;
    responseTime?: number;
    status: RequestStatus;
    errorMessage?: string;
}
export interface UpdateRequestHistoryDto {
    responseData?: Record<string, any>;
    tokensUsed?: number;
    cost?: number;
    responseTime?: number;
    status?: RequestStatus;
    errorMessage?: string;
}
export interface RequestHistoryQueryDto {
    userId: string;
    sessionId?: string;
    requestType?: RequestType;
    provider?: string;
    model?: string;
    status?: RequestStatus;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
    sortBy?: 'createdAt' | 'responseTime' | 'cost' | 'tokensUsed';
    sortOrder?: 'asc' | 'desc';
}
export interface RequestHistoryResponse {
    success: boolean;
    data?: RequestHistory | RequestHistory[];
    message?: string;
    pagination?: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}
export interface SessionHistory {
    id: string;
    userId: string;
    startedAt: Date;
    endedAt?: Date;
    duration?: number;
    requestsCount: number;
    totalTokens: number;
    totalCost: number;
    lastRequestAt?: Date;
    properties?: Record<string, any>;
}
export interface CreateSessionHistoryDto {
    userId: string;
    properties?: Record<string, any>;
}
export interface UpdateSessionHistoryDto {
    endedAt?: Date;
    properties?: Record<string, any>;
}
export interface SessionHistoryQueryDto {
    userId: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
    sortBy?: 'startedAt' | 'endedAt' | 'duration' | 'requestsCount' | 'totalCost';
    sortOrder?: 'asc' | 'desc';
}
export interface SessionHistoryResponse {
    success: boolean;
    data?: SessionHistory | SessionHistory[];
    message?: string;
    pagination?: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}
