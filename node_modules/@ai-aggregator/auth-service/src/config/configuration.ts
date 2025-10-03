import { MicroserviceConfig } from '@ai-aggregator/shared';

export const configuration = (): MicroserviceConfig => ({
  service: {
    name: 'auth-service',
    port: parseInt(process.env.AUTH_SERVICE_PORT || '3001', 10),
    host: process.env.HOST || '0.0.0.0',
    environment: (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development',
    version: process.env.APP_VERSION || '1.0.0',
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || '*',
      credentials: true,
    },
    swagger: {
      enabled: process.env.NODE_ENV !== 'production',
      path: 'api/docs',
    },
  },
  database: {
    url: process.env.AUTH_DATABASE_URL || '',
    host: process.env.AUTH_DB_HOST || 'localhost',
    port: parseInt(process.env.AUTH_DB_PORT || '5432', 10),
    database: process.env.AUTH_DB_NAME || 'auth_db',
    username: process.env.AUTH_DB_USERNAME || 'postgres',
    password: process.env.AUTH_DB_PASSWORD || 'password',
    ssl: process.env.AUTH_DB_SSL === 'true',
    maxConnections: parseInt(process.env.AUTH_DB_MAX_CONNECTIONS || '10', 10),
    connectionTimeout: parseInt(process.env.AUTH_DB_CONNECTION_TIMEOUT || '30000', 10),
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'ai_aggregator:auth:',
    ttl: parseInt(process.env.REDIS_TTL || '300', 10),
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
    host: process.env.RABBITMQ_HOST || 'localhost',
    port: parseInt(process.env.RABBITMQ_PORT || '5672', 10),
    username: process.env.RABBITMQ_USERNAME || 'guest',
    password: process.env.RABBITMQ_PASSWORD || 'guest',
    vhost: process.env.RABBITMQ_VHOST || '/',
    exchange: process.env.RABBITMQ_EXCHANGE || 'ai_aggregator',
    queue: process.env.RABBITMQ_AUTH_QUEUE || 'auth_service',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'ai-aggregator',
    audience: process.env.JWT_AUDIENCE || 'ai-aggregator-users',
  },
  providers: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      timeout: parseInt(process.env.OPENAI_TIMEOUT || '60000', 10),
      maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES || '3', 10),
      retryDelay: parseInt(process.env.OPENAI_RETRY_DELAY || '1000', 10),
    },
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY || '',
      baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      timeout: parseInt(process.env.OPENROUTER_TIMEOUT || '60000', 10),
      maxRetries: parseInt(process.env.OPENROUTER_MAX_RETRIES || '3', 10),
      retryDelay: parseInt(process.env.OPENROUTER_RETRY_DELAY || '1000', 10),
    },
  },
  billing: {
    defaultCurrency: process.env.BILLING_DEFAULT_CURRENCY || 'USD',
    defaultBalance: parseFloat(process.env.BILLING_DEFAULT_BALANCE || '100.0'),
    minDepositAmount: parseFloat(process.env.BILLING_MIN_DEPOSIT || '0.01'),
    maxDepositAmount: parseFloat(process.env.BILLING_MAX_DEPOSIT || '10000.0'),
    pricing: {
      'gpt-3.5-turbo': {
        input: 0.0000015,
        output: 0.000002,
      },
      'gpt-4': {
        input: 0.00003,
        output: 0.00006,
      },
    },
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESS === 'true',
    skipFailedRequests: process.env.RATE_LIMIT_SKIP_FAILED === 'true',
  },
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    metricsInterval: parseInt(process.env.METRICS_INTERVAL || '60000', 10),
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10),
    logLevel: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
    logRetentionDays: parseInt(process.env.LOG_RETENTION_DAYS || '30', 10),
  },
  security: {
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
    passwordMaxLength: parseInt(process.env.PASSWORD_MAX_LENGTH || '128', 10),
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '86400000', 10),
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '900000', 10),
    requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === 'true',
  },
});
