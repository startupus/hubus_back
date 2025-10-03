import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'staging', 'production').default('development'),
  BILLING_SERVICE_PORT: Joi.number().default(3004),
  BILLING_GRPC_PORT: Joi.number().default(50052),
  HOST: Joi.string().default('0.0.0.0'),
  
  // Database
  BILLING_DATABASE_URL: Joi.string().required(),
  
  // Redis
  REDIS_URL: Joi.string().required(),
  
  // RabbitMQ
  RABBITMQ_URL: Joi.string().required(),
  
  // Billing
  BILLING_DEFAULT_CURRENCY: Joi.string().default('USD'),
  BILLING_DEFAULT_BALANCE: Joi.number().default(100.0),
  
  // Monitoring
  LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').default('info'),
  MONITORING_ENABLED: Joi.boolean().default(false),
});
