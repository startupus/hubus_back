import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'staging', 'production').default('development'),
  ANALYTICS_SERVICE_PORT: Joi.number().default(3005),
  ANALYTICS_GRPC_PORT: Joi.number().default(50053),
  HOST: Joi.string().default('0.0.0.0'),
  
  // Redis
  REDIS_URL: Joi.string().required(),
  
  // RabbitMQ
  RABBITMQ_URL: Joi.string().required(),
  
  // Monitoring
  LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').default('info'),
  MONITORING_ENABLED: Joi.boolean().default(false),
});
