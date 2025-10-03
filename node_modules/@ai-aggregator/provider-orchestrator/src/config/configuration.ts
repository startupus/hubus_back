export default () => ({
  serviceName: 'provider-orchestrator',
  port: parseInt(process.env.ORCHESTRATOR_SERVICE_PORT, 10) || 3002,
  grpcPort: parseInt(process.env.ORCHESTRATOR_GRPC_PORT, 10) || 50054,
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  database: {
    url: process.env.ORCHESTRATOR_DATABASE_URL,
  },
  
  // Redis
  redis: {
    url: process.env.REDIS_URL,
  },
  
  // RabbitMQ
  rabbitmq: {
    url: process.env.RABBITMQ_URL,
  },
  
  // Providers
  providers: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
    },
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY,
    },
  },
});
