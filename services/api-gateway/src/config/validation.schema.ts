import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'staging', 'production').default('development'),
  PORT: Joi.number().default(3000),
  HOST: Joi.string().default('0.0.0.0'),
  
  // Database
  AUTH_DATABASE_URL: Joi.string().required(),
  BILLING_DATABASE_URL: Joi.string().required(),
  ORCHESTRATOR_DATABASE_URL: Joi.string().required(),
  
  // Redis
  REDIS_URL: Joi.string().required(),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional(),
  REDIS_DB: Joi.number().default(0),
  
  // RabbitMQ
  RABBITMQ_URL: Joi.string().required(),
  RABBITMQ_HOST: Joi.string().default('localhost'),
  RABBITMQ_PORT: Joi.number().default(5672),
  RABBITMQ_USERNAME: Joi.string().default('guest'),
  RABBITMQ_PASSWORD: Joi.string().default('guest'),
  
  // Service URLs
  AUTH_SERVICE_URL: Joi.string().default('http://auth-service:3001'),
  BILLING_SERVICE_URL: Joi.string().default('http://billing-service:3004'),
  ANALYTICS_SERVICE_URL: Joi.string().default('http://analytics-service:3005'),
  PROXY_SERVICE_URL: Joi.string().default('http://proxy-service:3003'),
  
  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('24h'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  
  // Providers
  OPENAI_API_KEY: Joi.string().required(),
  OPENROUTER_API_KEY: Joi.string().required(),
  ANTHROPIC_API_KEY: Joi.string().optional(),
  GOOGLE_API_KEY: Joi.string().optional(),
  COHERE_API_KEY: Joi.string().optional(),
  
  // Billing
  BILLING_DEFAULT_CURRENCY: Joi.string().default('USD'),
  BILLING_DEFAULT_BALANCE: Joi.number().default(100.0),
  
  // Security
  PASSWORD_MIN_LENGTH: Joi.number().default(8),
  PASSWORD_MAX_LENGTH: Joi.number().default(128),
  MAX_LOGIN_ATTEMPTS: Joi.number().default(5),
  
  // Monitoring
  LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').default('info'),
  MONITORING_ENABLED: Joi.boolean().default(false),
});
