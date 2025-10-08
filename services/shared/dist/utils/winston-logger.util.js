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
exports.globalLogger = exports.LoggerFactory = exports.WinstonLoggerService = void 0;
const winston = __importStar(require("winston"));
class WinstonLoggerService {
    context;
    serviceName;
    logger;
    constructor(context, serviceName) {
        this.context = context;
        this.serviceName = serviceName;
        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss.SSS',
            }), winston.format.errors({ stack: true }), winston.format.json(), winston.format.printf((info) => {
                const { timestamp, level, message, context, service, ...meta } = info;
                return JSON.stringify({
                    timestamp,
                    level,
                    message,
                    context: context || this.context,
                    service: service || this.serviceName,
                    ...meta,
                });
            })),
            defaultMeta: {
                service: this.serviceName,
                context: this.context,
            },
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
                }),
                new winston.transports.File({
                    filename: 'logs/error.log',
                    level: 'error',
                    format: winston.format.json(),
                }),
                new winston.transports.File({
                    filename: 'logs/combined.log',
                    format: winston.format.json(),
                }),
            ],
        });
        // Создаем директорию для логов если её нет
        if (typeof window === 'undefined') {
            const fs = require('fs');
            const path = require('path');
            const logDir = path.join(process.cwd(), 'logs');
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
        }
    }
    log(message, context, meta) {
        this.logger.info(message, {
            context: context || this.context,
            ...meta,
        });
    }
    error(message, trace, context, meta) {
        this.logger.error(message, {
            context: context || this.context,
            trace,
            ...meta,
        });
    }
    warn(message, context, meta) {
        this.logger.warn(message, {
            context: context || this.context,
            ...meta,
        });
    }
    debug(message, context, meta) {
        this.logger.debug(message, {
            context: context || this.context,
            ...meta,
        });
    }
    verbose(message, context, meta) {
        this.logger.verbose(message, {
            context: context || this.context,
            ...meta,
        });
    }
    // Метод для структурированного логирования
    structuredLog(level, message, meta) {
        this.logger[level](message, {
            context: this.context,
            service: this.serviceName,
            ...meta,
        });
    }
    // Метод для логирования HTTP запросов
    logHttpRequest(method, url, statusCode, responseTime, meta) {
        this.structuredLog('info', 'HTTP Request', {
            type: 'http_request',
            method,
            url,
            statusCode,
            responseTime,
            ...meta,
        });
    }
    // Метод для логирования ошибок с контекстом
    logError(error, context, meta) {
        this.structuredLog('error', error.message, {
            type: 'error',
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
            },
            ...meta,
        });
    }
    // Метод для логирования бизнес-событий
    logBusinessEvent(eventType, eventData, meta) {
        this.structuredLog('info', 'Business Event', {
            type: 'business_event',
            eventType,
            eventData,
            ...meta,
        });
    }
}
exports.WinstonLoggerService = WinstonLoggerService;
// Фабрика для создания логгеров
class LoggerFactory {
    static createLogger(context, serviceName) {
        return new WinstonLoggerService(context, serviceName);
    }
}
exports.LoggerFactory = LoggerFactory;
// Глобальный логгер для использования в любом месте приложения
exports.globalLogger = new WinstonLoggerService('Global', process.env.SERVICE_NAME || 'unknown-service');
//# sourceMappingURL=winston-logger.util.js.map