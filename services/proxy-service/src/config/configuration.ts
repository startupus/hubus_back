export default () => ({
  serviceName: 'proxy-service',
  port: parseInt(process.env.PROXY_SERVICE_PORT, 10) || 3003,
  grpcPort: parseInt(process.env.PROXY_GRPC_PORT, 10) || 50055,
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  
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
    github: {
      apiKey: process.env.GITHUB_API_KEY,
      baseUrl: process.env.GITHUB_BASE_URL || 'https://api.github.com/copilot_internal/v1',
    },
  },
});
