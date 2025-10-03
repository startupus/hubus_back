"use strict";
/**
 * Application constants
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRICING = exports.PROVIDER_CONFIG = exports.HTTP_STATUS = exports.ERROR_CODES = exports.APP_CONSTANTS = void 0;
exports.APP_CONSTANTS = {
    // Application
    APP_NAME: 'AI Aggregator',
    APP_VERSION: '1.0.0',
    // Pagination
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: 100,
    // JWT
    JWT_DEFAULT_EXPIRES_IN: '24h',
    JWT_REFRESH_EXPIRES_IN: '7d',
    // API Keys
    API_KEY_PREFIX: 'ak_',
    API_KEY_LENGTH: 40,
    // Tokens
    PASSWORD_RESET_TOKEN_LENGTH: 32,
    EMAIL_VERIFICATION_TOKEN_LENGTH: 32,
    REFRESH_TOKEN_LENGTH: 64,
    // Billing
    DEFAULT_CURRENCY: 'USD',
    DEFAULT_BALANCE: 100.0,
    MIN_DEPOSIT_AMOUNT: 0.01,
    MAX_DEPOSIT_AMOUNT: 10000.0,
    // Providers
    SUPPORTED_PROVIDERS: ['openai', 'openrouter', 'anthropic', 'google', 'cohere'],
    // Models
    DEFAULT_MODEL: 'gpt-3.5-turbo',
    MAX_TOKENS_PER_REQUEST: 32000,
    DEFAULT_TEMPERATURE: 0.7,
    DEFAULT_MAX_TOKENS: 1000,
    // Retry
    DEFAULT_MAX_RETRIES: 3,
    DEFAULT_RETRY_DELAY: 1000,
    // Timeouts
    DEFAULT_TIMEOUT: 30000, // 30 seconds
    PROVIDER_TIMEOUT: 60000, // 60 seconds
    // Cache
    CACHE_TTL: 300, // 5 minutes
    CACHE_PREFIX: 'ai_aggregator',
    // Health Check
    HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
    // Security
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128,
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
    // File Upload
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'text/plain'],
    // Monitoring
    METRICS_INTERVAL: 60000, // 1 minute
    LOG_RETENTION_DAYS: 30,
};
exports.ERROR_CODES = {
    // Authentication
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
    INVALID_TOKEN: 'INVALID_TOKEN',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    INVALID_API_KEY: 'INVALID_API_KEY',
    API_KEY_EXPIRED: 'API_KEY_EXPIRED',
    INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
    // Validation
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_EMAIL: 'INVALID_EMAIL',
    INVALID_PASSWORD: 'INVALID_PASSWORD',
    INVALID_UUID: 'INVALID_UUID',
    // Billing
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
    BILLING_LIMIT_EXCEEDED: 'BILLING_LIMIT_EXCEEDED',
    INVALID_AMOUNT: 'INVALID_AMOUNT',
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    // Providers
    PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
    PROVIDER_ERROR: 'PROVIDER_ERROR',
    MODEL_NOT_FOUND: 'MODEL_NOT_FOUND',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    // System
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    DATABASE_ERROR: 'DATABASE_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    // Not Found
    NOT_FOUND: 'NOT_FOUND',
    RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
    // Forbidden
    FORBIDDEN: 'FORBIDDEN',
    ACCESS_DENIED: 'ACCESS_DENIED',
    // Bad Request
    BAD_REQUEST: 'BAD_REQUEST',
    INVALID_REQUEST: 'INVALID_REQUEST',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
};
exports.HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
};
exports.PROVIDER_CONFIG = {
    openai: {
        baseUrl: 'https://api.openai.com/v1',
        models: [
            'gpt-3.5-turbo',
            'gpt-4',
            'gpt-4-turbo-preview',
            'gpt-4-vision-preview',
        ],
        capabilities: {
            supportsStreaming: true,
            supportsFunctionCalling: true,
            supportsVision: true,
            supportsEmbeddings: true,
        },
    },
    openrouter: {
        baseUrl: 'https://openrouter.ai/api/v1',
        models: [
            'openai/gpt-3.5-turbo',
            'openai/gpt-4',
            'anthropic/claude-3-sonnet',
            'google/gemini-pro',
        ],
        capabilities: {
            supportsStreaming: true,
            supportsFunctionCalling: true,
            supportsVision: false,
            supportsEmbeddings: false,
        },
    },
};
exports.PRICING = {
    'gpt-3.5-turbo': {
        input: 0.0000015,
        output: 0.000002,
    },
    'gpt-4': {
        input: 0.00003,
        output: 0.00006,
    },
    'gpt-4-turbo-preview': {
        input: 0.00001,
        output: 0.00003,
    },
};
//# sourceMappingURL=index.js.map