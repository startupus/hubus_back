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
    AUTH_SERVICE_PORT: Joi.number().default(3001),
    AUTH_GRPC_PORT: Joi.number().default(50051),
    HOST: Joi.string().default('0.0.0.0'),
    AUTH_DATABASE_URL: Joi.string().required(),
    AUTH_DB_HOST: Joi.string().default('localhost'),
    AUTH_DB_PORT: Joi.number().default(5432),
    AUTH_DB_NAME: Joi.string().default('auth_db'),
    AUTH_DB_USERNAME: Joi.string().default('postgres'),
    AUTH_DB_PASSWORD: Joi.string().default('password'),
    AUTH_DB_SSL: Joi.boolean().default(false),
    REDIS_URL: Joi.string().required(),
    REDIS_HOST: Joi.string().default('localhost'),
    REDIS_PORT: Joi.number().default(6379),
    REDIS_PASSWORD: Joi.string().optional(),
    REDIS_DB: Joi.number().default(0),
    RABBITMQ_URL: Joi.string().required(),
    RABBITMQ_HOST: Joi.string().default('localhost'),
    RABBITMQ_PORT: Joi.number().default(5672),
    RABBITMQ_USERNAME: Joi.string().default('guest'),
    RABBITMQ_PASSWORD: Joi.string().default('guest'),
    RABBITMQ_AUTH_QUEUE: Joi.string().default('auth_service'),
    JWT_SECRET: Joi.string().required(),
    JWT_EXPIRES_IN: Joi.string().default('24h'),
    JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
    JWT_ISSUER: Joi.string().default('ai-aggregator'),
    JWT_AUDIENCE: Joi.string().default('ai-aggregator-users'),
    PASSWORD_MIN_LENGTH: Joi.number().default(8),
    PASSWORD_MAX_LENGTH: Joi.number().default(128),
    MAX_LOGIN_ATTEMPTS: Joi.number().default(5),
    LOCKOUT_DURATION: Joi.number().default(900000),
    REQUIRE_EMAIL_VERIFICATION: Joi.boolean().default(false),
    LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').default('info'),
    MONITORING_ENABLED: Joi.boolean().default(false),
});
//# sourceMappingURL=validation.schema.js.map