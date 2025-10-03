export default () => ({
  serviceName: 'analytics-service',
  port: parseInt(process.env.ANALYTICS_SERVICE_PORT, 10) || 3005,
  grpcPort: parseInt(process.env.ANALYTICS_GRPC_PORT, 10) || 50053,
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
  
  // Monitoring
  logLevel: process.env.LOG_LEVEL || 'info',
  monitoringEnabled: process.env.MONITORING_ENABLED === 'true',
});
