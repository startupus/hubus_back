"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    serviceName: 'proxy-service',
    port: parseInt(process.env.PROXY_SERVICE_PORT, 10) || 3003,
    grpcPort: parseInt(process.env.PROXY_GRPC_PORT, 10) || 50055,
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
    redis: {
        url: process.env.REDIS_URL,
    },
    rabbitmq: {
        url: process.env.RABBITMQ_URL,
    },
    providers: {
        openai: {
            apiKey: process.env.OPENAI_API_KEY,
        },
        openrouter: {
            apiKey: process.env.OPENROUTER_API_KEY,
        },
    },
});
//# sourceMappingURL=configuration.js.map