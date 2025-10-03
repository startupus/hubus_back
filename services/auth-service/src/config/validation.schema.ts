import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'staging', 'production').default('development'),
  AUTH_SERVICE_PORT: Joi.number().default(3001),
  AUTH_GRPC_PORT: Joi.number().default(50051),
  HOST: Joi.string().default('0.0.0.0'),
  
  // Database
  AUTH_DATABASE_URL: Joi.string().required(),
  AUTH_DB_HOST: Joi.string().default('localhost'),
  AUTH_DB_PORT: Joi.number().default(5432),
  AUTH_DB_NAME: Joi.string().default('auth_db'),
  AUTH_DB_USERNAME: Joi.string().default('postgres'),
  AUTH_DB_PASSWORD: Joi.string().default('password'),
  AUTH_DB_SSL: Joi.boolean().default(false),
  
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
  RABBITMQ_AUTH_QUEUE: Joi.string().default('auth_service'),
  
  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('24h'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  JWT_ISSUER: Joi.string().default('ai-aggregator'),
  JWT_AUDIENCE: Joi.string().default('ai-aggregator-users'),
  
  // Security
  PASSWORD_MIN_LENGTH: Joi.number().default(8),
  PASSWORD_MAX_LENGTH: Joi.number().default(128),
  MAX_LOGIN_ATTEMPTS: Joi.number().default(5),
  LOCKOUT_DURATION: Joi.number().default(900000),
  REQUIRE_EMAIL_VERIFICATION: Joi.boolean().default(false),
  
  // Monitoring
  LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').default('info'),
  MONITORING_ENABLED: Joi.boolean().default(false),
});
