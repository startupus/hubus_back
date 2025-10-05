import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3007),
  CORS_ORIGIN: Joi.string().default('*'),
  DATABASE_URL: Joi.string().required(),
  REDIS_URL: Joi.string().default('redis://localhost:6379'),
  RABBITMQ_URL: Joi.string().default('amqp://localhost:5672'),
});
