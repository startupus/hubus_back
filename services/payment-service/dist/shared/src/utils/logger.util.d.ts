export declare class LoggerUtil {
    private static formatLogEntry;
    private static formatJsonLogEntry;
    static log(entry: any): void;
    static debug(service: string, message: string, metadata?: Record<string, unknown>, requestId?: string, userId?: string): void;
    static info(service: string, message: string, metadata?: Record<string, unknown>, requestId?: string, userId?: string): void;
    static warn(service: string, message: string, metadata?: Record<string, unknown>, requestId?: string, userId?: string): void;
    static error(service: string, message: string, error?: Error, metadata?: Record<string, unknown>, requestId?: string, userId?: string): void;
    static fatal(service: string, message: string, error?: Error, metadata?: Record<string, unknown>, requestId?: string, userId?: string): void;
    static logRequest(service: string, method: string, url: string, statusCode: number, responseTime: number, requestId?: string, userId?: string): void;
    static logDatabase(service: string, operation: string, table: string, duration: number, requestId?: string, userId?: string): void;
    static logExternalApi(service: string, provider: string, endpoint: string, statusCode: number, duration: number, requestId?: string, userId?: string): void;
    static generateCorrelationId(): string;
}
export declare const generateCorrelationId: typeof LoggerUtil.generateCorrelationId;
