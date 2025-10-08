import { LoggerService } from '@nestjs/common';
export interface LogContext {
    service?: string;
    userId?: string;
    requestId?: string;
    correlationId?: string;
    [key: string]: any;
}
export declare class WinstonLoggerService implements LoggerService {
    private readonly context?;
    private readonly serviceName?;
    private readonly logger;
    constructor(context?: string, serviceName?: string);
    log(message: string, context?: string, meta?: LogContext): void;
    error(message: string, trace?: string, context?: string, meta?: LogContext): void;
    warn(message: string, context?: string, meta?: LogContext): void;
    debug(message: string, context?: string, meta?: LogContext): void;
    verbose(message: string, context?: string, meta?: LogContext): void;
    structuredLog(level: 'info' | 'error' | 'warn' | 'debug' | 'verbose', message: string, meta: LogContext): void;
    logHttpRequest(method: string, url: string, statusCode: number, responseTime: number, meta?: LogContext): void;
    logError(error: Error, context?: string, meta?: LogContext): void;
    logBusinessEvent(eventType: string, eventData: any, meta?: LogContext): void;
}
export declare class LoggerFactory {
    static createLogger(context: string, serviceName?: string): WinstonLoggerService;
}
export declare const globalLogger: WinstonLoggerService;
//# sourceMappingURL=winston-logger.util.d.ts.map