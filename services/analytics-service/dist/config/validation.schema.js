"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationSchema = void 0;
const Joi = __importStar(require("joi"));
exports.validationSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'staging', 'production').default('development'),
    ANALYTICS_SERVICE_PORT: Joi.number().port().default(3005),
    HOST: Joi.string().default('0.0.0.0'),
    APP_VERSION: Joi.string().default('1.0.0'),
    ANALYTICS_DATABASE_URL: Joi.string().required(),
    ANALYTICS_DB_HOST: Joi.string().default('localhost'),
    ANALYTICS_DB_PORT: Joi.number().port().default(5432),
    ANALYTICS_DB_NAME: Joi.string().default('analytics_db'),
    ANALYTICS_DB_USERNAME: Joi.string().default('postgres'),
    ANALYTICS_DB_PASSWORD: Joi.string().default('password'),
    ANALYTICS_DB_SSL: Joi.boolean().default(false),
    ANALYTICS_DB_MAX_CONNECTIONS: Joi.number().positive().default(10),
    ANALYTICS_DB_CONNECTION_TIMEOUT: Joi.number().positive().default(30000),
    REDIS_URL: Joi.string().default('redis://localhost:6379'),
    REDIS_HOST: Joi.string().default('localhost'),
    REDIS_PORT: Joi.number().port().default(6379),
    REDIS_PASSWORD: Joi.string().optional(),
    REDIS_DB: Joi.number().min(0).max(15).default(0),
    REDIS_KEY_PREFIX: Joi.string().default('ai_aggregator:analytics:'),
    REDIS_TTL: Joi.number().positive().default(300),
    RABBITMQ_URL: Joi.string().default('amqp://guest:guest@localhost:5672'),
    RABBITMQ_HOST: Joi.string().default('localhost'),
    RABBITMQ_PORT: Joi.number().port().default(5672),
    RABBITMQ_USERNAME: Joi.string().default('guest'),
    RABBITMQ_PASSWORD: Joi.string().default('guest'),
    RABBITMQ_VHOST: Joi.string().default('/'),
    RABBITMQ_EXCHANGE: Joi.string().default('ai_aggregator'),
    RABBITMQ_QUEUE: Joi.string().default('analytics_service'),
    JWT_SECRET: Joi.string().required(),
    JWT_EXPIRES_IN: Joi.string().default('24h'),
    JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
    JWT_ISSUER: Joi.string().default('ai-aggregator'),
    JWT_AUDIENCE: Joi.string().default('ai-aggregator-users'),
    PROMETHEUS_ENABLED: Joi.boolean().default(false),
    PROMETHEUS_ENDPOINT: Joi.string().uri().default('http://localhost:9090'),
    GRAFANA_ENABLED: Joi.boolean().default(false),
    GRAFANA_API_URL: Joi.string().uri().default('http://localhost:3000'),
    GRAFANA_API_KEY: Joi.string().optional(),
    GRAFANA_DATASOURCE_NAME: Joi.string().default('analytics-db'),
    WEBHOOKS: Joi.array().items(Joi.object({
        id: Joi.string().required(),
        url: Joi.string().uri().required(),
        events: Joi.array().items(Joi.string()).default(['event', 'metrics', 'alert']),
        headers: Joi.object().pattern(Joi.string(), Joi.string()).default({}),
        timeout: Joi.number().positive().default(5000),
        enabled: Joi.boolean().default(true),
    })).default([]),
    MONITORING_ENABLED: Joi.boolean().default(false),
    METRICS_INTERVAL: Joi.number().positive().default(60000),
    HEALTH_CHECK_INTERVAL: Joi.number().positive().default(30000),
    LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').default('info'),
    LOG_RETENTION_DAYS: Joi.number().positive().default(30),
    RATE_LIMIT_WINDOW_MS: Joi.number().positive().default(60000),
    RATE_LIMIT_MAX_REQUESTS: Joi.number().positive().default(100),
    RATE_LIMIT_SKIP_SUCCESS: Joi.boolean().default(false),
    RATE_LIMIT_SKIP_FAILED: Joi.boolean().default(false),
    EXPORT_DIR: Joi.string().default('./exports'),
    EXPORT_RETENTION_DAYS: Joi.number().positive().default(7),
    CORS_ORIGIN: Joi.string().optional(),
});
//# sourceMappingURL=validation.schema.js.map