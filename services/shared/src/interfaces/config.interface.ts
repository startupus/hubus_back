/**
 * Configuration interfaces for microservices
 */

export interface DatabaseConfig {
  url: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
  connectionTimeout?: number;
}

export interface RedisConfig {
  url: string;
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  ttl?: number;
}

export interface RabbitMQConfig {
  url: string;
  host: string;
  port: number;
  username: string;
  password: string;
  vhost?: string;
  exchange?: string;
  queue?: string;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
  issuer?: string;
  audience?: string;
}

export interface ProviderConfig {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export interface ProvidersConfig {
  openai: ProviderConfig;
  openrouter: ProviderConfig;
  yandex: ProviderConfig & { folderId: string };
  anthropic?: ProviderConfig;
  google?: ProviderConfig;
  cohere?: ProviderConfig;
}

export interface BillingConfig {
  defaultCurrency: string;
  defaultBalance: number;
  minDepositAmount: number;
  maxDepositAmount: number;
  pricing: Record<string, { input: number; output: number }>;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface MonitoringConfig {
  enabled: boolean;
  metricsInterval: number;
  healthCheckInterval: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logRetentionDays: number;
}

export interface SecurityConfig {
  passwordMinLength: number;
  passwordMaxLength: number;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  requireEmailVerification: boolean;
}

export interface ServiceEndpointConfig {
  url: string;
  timeout: number;
}

export interface ServicesConfig {
  auth: ServiceEndpointConfig;
  billing: ServiceEndpointConfig;
  analytics: ServiceEndpointConfig;
  proxy: ServiceEndpointConfig;
  classification: ServiceEndpointConfig;
  certification: ServiceEndpointConfig;
  safety: ServiceEndpointConfig;
}

export interface ServiceConfig {
  name: string;
  port: number;
  host: string;
  environment: 'development' | 'staging' | 'production';
  version: string;
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  swagger: {
    enabled: boolean;
    path: string;
  };
}

export interface MicroserviceConfig {
  service: ServiceConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  rabbitmq: RabbitMQConfig;
  jwt: JwtConfig;
  providers: ProvidersConfig;
  services: ServicesConfig;
  billing: BillingConfig;
  rateLimit: RateLimitConfig;
  monitoring: MonitoringConfig;
  security: SecurityConfig;
  anonymization?: {
    enabled: boolean;
    enabledForProvider: string;
    enabledForModel: string;
    preserveMetadata: boolean;
  };
}

export interface EnvironmentVariables {
  NODE_ENV: 'development' | 'staging' | 'production';
  PORT: number;
  HOST: string;
  
  // Database
  AUTH_DATABASE_URL: string;
  BILLING_DATABASE_URL: string;
  ORCHESTRATOR_DATABASE_URL: string;
  
  // Redis
  REDIS_URL: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
  
  // RabbitMQ
  RABBITMQ_URL: string;
  RABBITMQ_HOST: string;
  RABBITMQ_PORT: number;
  RABBITMQ_USERNAME: string;
  RABBITMQ_PASSWORD: string;
  
  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  
  // Providers
  OPENAI_API_KEY: string;
  OPENROUTER_API_KEY: string;
  ANTHROPIC_API_KEY?: string;
  GOOGLE_API_KEY?: string;
  COHERE_API_KEY?: string;
  
  // Billing
  BILLING_DEFAULT_CURRENCY: string;
  BILLING_DEFAULT_BALANCE: number;
  
  // Security
  PASSWORD_MIN_LENGTH: number;
  PASSWORD_MAX_LENGTH: number;
  MAX_LOGIN_ATTEMPTS: number;
  
  // Monitoring
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  METRICS_ENABLED: boolean;
}
