"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    serviceName: 'billing-service',
    port: parseInt(process.env.BILLING_SERVICE_PORT, 10) || 3004,
    grpcPort: parseInt(process.env.BILLING_GRPC_PORT, 10) || 50052,
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
    database: {
        url: process.env.BILLING_DATABASE_URL,
    },
    redis: {
        url: process.env.REDIS_URL,
    },
    rabbitmq: {
        url: process.env.RABBITMQ_URL,
    },
    billing: {
        defaultCurrency: process.env.BILLING_DEFAULT_CURRENCY || 'USD',
        defaultBalance: parseFloat(process.env.BILLING_DEFAULT_BALANCE) || 100.0,
    },
});
//# sourceMappingURL=configuration.js.map