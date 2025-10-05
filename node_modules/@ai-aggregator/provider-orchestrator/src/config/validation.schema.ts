import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'staging', 'production').default('development'),
  ORCHESTRATOR_SERVICE_PORT: Joi.number().default(3002),
  ORCHESTRATOR_GRPC_PORT: Joi.number().default(50054),
  HOST: Joi.string().default('0.0.0.0'),
  
  // Database
  ORCHESTRATOR_DATABASE_URL: Joi.string().required(),
  
  // Redis
  REDIS_URL: Joi.string().required(),
  
  // RabbitMQ
  RABBITMQ_URL: Joi.string().required(),
  
  // Providers
  OPENAI_API_KEY: Joi.string().required(),
  OPENROUTER_API_KEY: Joi.string().required(),
  YANDEX_API_KEY: Joi.string().required(),
  YANDEX_FOLDER_ID: Joi.string().required(),
  
  // Monitoring
  LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').default('info'),
  MONITORING_ENABLED: Joi.boolean().default(false),
});
