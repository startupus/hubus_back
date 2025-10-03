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
    PORT: Joi.number().default(3000),
    HOST: Joi.string().default('0.0.0.0'),
    AUTH_DATABASE_URL: Joi.string().required(),
    BILLING_DATABASE_URL: Joi.string().required(),
    ORCHESTRATOR_DATABASE_URL: Joi.string().required(),
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
    JWT_SECRET: Joi.string().required(),
    JWT_EXPIRES_IN: Joi.string().default('24h'),
    JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
    OPENAI_API_KEY: Joi.string().required(),
    OPENROUTER_API_KEY: Joi.string().required(),
    ANTHROPIC_API_KEY: Joi.string().optional(),
    GOOGLE_API_KEY: Joi.string().optional(),
    COHERE_API_KEY: Joi.string().optional(),
    BILLING_DEFAULT_CURRENCY: Joi.string().default('USD'),
    BILLING_DEFAULT_BALANCE: Joi.number().default(100.0),
    PASSWORD_MIN_LENGTH: Joi.number().default(8),
    PASSWORD_MAX_LENGTH: Joi.number().default(128),
    MAX_LOGIN_ATTEMPTS: Joi.number().default(5),
    LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').default('info'),
    MONITORING_ENABLED: Joi.boolean().default(false),
});
//# sourceMappingURL=validation.schema.js.map