"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    serviceName: 'ai-certification-service',
    port: parseInt(process.env.PORT, 10) || 3007,
    environment: process.env.NODE_ENV || 'development',
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
    },
    database: {
        url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/ai_certification',
    },
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
    rabbitmq: {
        url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    },
});
//# sourceMappingURL=configuration.js.map