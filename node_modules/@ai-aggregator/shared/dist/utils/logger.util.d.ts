/**
 * Logging utilities
 */
export declare class LoggerUtil {
    private static formatLogEntry;
    private static formatJsonLogEntry;
    /**
     * Log a message with the specified level
     */
    static log(entry: any): void;
    /**
     * Log a debug message
     */
    static debug(service: string, message: string, metadata?: Record<string, unknown>, requestId?: string, userId?: string): void;
    /**
     * Log an info message
     */
    static info(service: string, message: string, metadata?: Record<string, unknown>, requestId?: string, userId?: string): void;
    /**
     * Log a warning message
     */
    static warn(service: string, message: string, metadata?: Record<string, unknown>, requestId?: string, userId?: string): void;
    /**
     * Log an error message
     */
    static error(service: string, message: string, error?: Error, metadata?: Record<string, unknown>, requestId?: string, userId?: string): void;
    /**
     * Log a fatal error message
     */
    static fatal(service: string, message: string, error?: Error, metadata?: Record<string, unknown>, requestId?: string, userId?: string): void;
    /**
     * Log a request
     */
    static logRequest(service: string, method: string, url: string, statusCode: number, responseTime: number, requestId?: string, userId?: string): void;
    /**
     * Log a database operation
     */
    static logDatabase(service: string, operation: string, table: string, duration: number, requestId?: string, userId?: string): void;
    /**
     * Log an external API call
     */
    static logExternalApi(service: string, provider: string, endpoint: string, statusCode: number, duration: number, requestId?: string, userId?: string): void;
    /**
     * Generate a correlation ID for request tracking
     */
    static generateCorrelationId(): string;
}
export declare const generateCorrelationId: typeof LoggerUtil.generateCorrelationId;
//# sourceMappingURL=logger.util.d.ts.map