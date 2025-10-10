export declare const APP_CONSTANTS: {
    readonly APP_NAME: "AI Aggregator";
    readonly APP_VERSION: "1.0.0";
    readonly DEFAULT_PAGE_SIZE: 10;
    readonly MAX_PAGE_SIZE: 100;
    readonly RATE_LIMIT_WINDOW_MS: number;
    readonly RATE_LIMIT_MAX_REQUESTS: 100;
    readonly JWT_DEFAULT_EXPIRES_IN: "24h";
    readonly JWT_REFRESH_EXPIRES_IN: "7d";
    readonly API_KEY_PREFIX: "ak_";
    readonly API_KEY_LENGTH: 40;
    readonly PASSWORD_RESET_TOKEN_LENGTH: 32;
    readonly EMAIL_VERIFICATION_TOKEN_LENGTH: 32;
    readonly REFRESH_TOKEN_LENGTH: 64;
    readonly DEFAULT_CURRENCY: "USD";
    readonly DEFAULT_BALANCE: 100;
    readonly MIN_DEPOSIT_AMOUNT: 0.01;
    readonly MAX_DEPOSIT_AMOUNT: 10000;
    readonly SUPPORTED_PROVIDERS: readonly ["openai", "openrouter", "anthropic", "google", "cohere"];
    readonly DEFAULT_MODEL: "gpt-3.5-turbo";
    readonly MAX_TOKENS_PER_REQUEST: 32000;
    readonly DEFAULT_TEMPERATURE: 0.7;
    readonly DEFAULT_MAX_TOKENS: 1000;
    readonly DEFAULT_MAX_RETRIES: 3;
    readonly DEFAULT_RETRY_DELAY: 1000;
    readonly DEFAULT_TIMEOUT: 30000;
    readonly PROVIDER_TIMEOUT: 60000;
    readonly CACHE_TTL: 300;
    readonly CACHE_PREFIX: "ai_aggregator";
    readonly HEALTH_CHECK_INTERVAL: 30000;
    readonly PASSWORD_MIN_LENGTH: 8;
    readonly PASSWORD_MAX_LENGTH: 128;
    readonly SESSION_TIMEOUT: number;
    readonly MAX_FILE_SIZE: number;
    readonly ALLOWED_FILE_TYPES: readonly ["image/jpeg", "image/png", "image/gif", "text/plain"];
    readonly METRICS_INTERVAL: 60000;
    readonly LOG_RETENTION_DAYS: 30;
};
export declare const ERROR_CODES: {
    readonly INVALID_CREDENTIALS: "INVALID_CREDENTIALS";
    readonly USER_NOT_FOUND: "USER_NOT_FOUND";
    readonly USER_ALREADY_EXISTS: "USER_ALREADY_EXISTS";
    readonly INVALID_TOKEN: "INVALID_TOKEN";
    readonly TOKEN_EXPIRED: "TOKEN_EXPIRED";
    readonly INVALID_API_KEY: "INVALID_API_KEY";
    readonly API_KEY_EXPIRED: "API_KEY_EXPIRED";
    readonly INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly INVALID_EMAIL: "INVALID_EMAIL";
    readonly INVALID_PASSWORD: "INVALID_PASSWORD";
    readonly INVALID_UUID: "INVALID_UUID";
    readonly INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE";
    readonly BILLING_LIMIT_EXCEEDED: "BILLING_LIMIT_EXCEEDED";
    readonly INVALID_AMOUNT: "INVALID_AMOUNT";
    readonly PAYMENT_FAILED: "PAYMENT_FAILED";
    readonly PROVIDER_UNAVAILABLE: "PROVIDER_UNAVAILABLE";
    readonly PROVIDER_ERROR: "PROVIDER_ERROR";
    readonly MODEL_NOT_FOUND: "MODEL_NOT_FOUND";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
    readonly DATABASE_ERROR: "DATABASE_ERROR";
    readonly NETWORK_ERROR: "NETWORK_ERROR";
    readonly TIMEOUT_ERROR: "TIMEOUT_ERROR";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly ACCESS_DENIED: "ACCESS_DENIED";
    readonly BAD_REQUEST: "BAD_REQUEST";
    readonly INVALID_REQUEST: "INVALID_REQUEST";
    readonly MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD";
};
export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly CONFLICT: 409;
    readonly UNPROCESSABLE_ENTITY: 422;
    readonly TOO_MANY_REQUESTS: 429;
    readonly INTERNAL_SERVER_ERROR: 500;
    readonly BAD_GATEWAY: 502;
    readonly SERVICE_UNAVAILABLE: 503;
    readonly GATEWAY_TIMEOUT: 504;
};
export declare const PROVIDER_CONFIG: {
    readonly openai: {
        readonly baseUrl: "https://api.openai.com/v1";
        readonly models: readonly ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo-preview", "gpt-4-vision-preview"];
        readonly capabilities: {
            readonly supportsStreaming: true;
            readonly supportsFunctionCalling: true;
            readonly supportsVision: true;
            readonly supportsEmbeddings: true;
        };
    };
    readonly openrouter: {
        readonly baseUrl: "https://openrouter.ai/api/v1";
        readonly models: readonly ["openai/gpt-3.5-turbo", "openai/gpt-4", "anthropic/claude-3-sonnet", "google/gemini-pro"];
        readonly capabilities: {
            readonly supportsStreaming: true;
            readonly supportsFunctionCalling: true;
            readonly supportsVision: false;
            readonly supportsEmbeddings: false;
        };
    };
};
export declare const PRICING: {
    readonly 'gpt-3.5-turbo': {
        readonly input: 0.0000015;
        readonly output: 0.000002;
    };
    readonly 'gpt-4': {
        readonly input: 0.00003;
        readonly output: 0.00006;
    };
    readonly 'gpt-4-turbo-preview': {
        readonly input: 0.00001;
        readonly output: 0.00003;
    };
};
