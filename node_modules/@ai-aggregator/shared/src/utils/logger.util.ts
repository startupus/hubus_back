/**
 * Logging utilities
 */

export class LoggerUtil {
  private static formatLogEntry(entry: any): string {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const service = entry.service.padEnd(20);
    const requestId = entry.requestId ? `[${entry.requestId}]` : '';
    const userId = entry.userId ? `[${entry.userId}]` : '';
    
    let logMessage = `${timestamp} ${level} ${service} ${requestId} ${userId} ${entry.message}`;
    
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      logMessage += ` | Metadata: ${JSON.stringify(entry.metadata)}`;
    }
    
    if (entry.error) {
      logMessage += ` | Error: ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.stack) {
        logMessage += ` | Stack: ${entry.error.stack}`;
      }
    }
    
    return logMessage;
  }

  private static formatJsonLogEntry(entry: any): string {
    return JSON.stringify({
      timestamp: entry.timestamp.toISOString(),
      level: entry.level,
      service: entry.service,
      message: entry.message,
      requestId: entry.requestId,
      userId: entry.userId,
      metadata: entry.metadata,
      error: entry.error ? {
        name: entry.error.name,
        message: entry.error.message,
        stack: entry.error.stack,
      } : undefined,
    });
  }

  /**
   * Log a message with the specified level
   */
  static log(entry: any): void {
    const useJsonFormat = process.env.LOG_FORMAT === 'json';
    const formattedMessage = useJsonFormat 
      ? this.formatJsonLogEntry(entry)
      : this.formatLogEntry(entry);
    
    switch (entry.level) {
      case 'debug':
        console.debug(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
      case 'fatal':
        console.error(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  }

  /**
   * Log a debug message
   */
  static debug(
    service: string,
    message: string,
    metadata?: Record<string, unknown>,
    requestId?: string,
    userId?: string
  ): void {
    this.log({
      level: 'debug',
      message,
      timestamp: new Date(),
      service,
      requestId,
      userId,
      metadata,
    });
  }

  /**
   * Log an info message
   */
  static info(
    service: string,
    message: string,
    metadata?: Record<string, unknown>,
    requestId?: string,
    userId?: string
  ): void {
    this.log({
      level: 'info',
      message,
      timestamp: new Date(),
      service,
      requestId,
      userId,
      metadata,
    });
  }

  /**
   * Log a warning message
   */
  static warn(
    service: string,
    message: string,
    metadata?: Record<string, unknown>,
    requestId?: string,
    userId?: string
  ): void {
    this.log({
      level: 'warn',
      message,
      timestamp: new Date(),
      service,
      requestId,
      userId,
      metadata,
    });
  }

  /**
   * Log an error message
   */
  static error(
    service: string,
    message: string,
    error?: Error,
    metadata?: Record<string, unknown>,
    requestId?: string,
    userId?: string
  ): void {
    this.log({
      level: 'error',
      message,
      timestamp: new Date(),
      service,
      requestId,
      userId,
      metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }

  /**
   * Log a fatal error message
   */
  static fatal(
    service: string,
    message: string,
    error?: Error,
    metadata?: Record<string, unknown>,
    requestId?: string,
    userId?: string
  ): void {
    this.log({
      level: 'fatal',
      message,
      timestamp: new Date(),
      service,
      requestId,
      userId,
      metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }

  /**
   * Log a request
   */
  static logRequest(
    service: string,
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    requestId?: string,
    userId?: string
  ): void {
    this.info(
      service,
      `${method} ${url} ${statusCode} - ${responseTime}ms`,
      {
        method,
        url,
        statusCode,
        responseTime,
      },
      requestId,
      userId
    );
  }

  /**
   * Log a database operation
   */
  static logDatabase(
    service: string,
    operation: string,
    table: string,
    duration: number,
    requestId?: string,
    userId?: string
  ): void {
    this.debug(
      service,
      `Database ${operation} on ${table} - ${duration}ms`,
      {
        operation,
        table,
        duration,
      },
      requestId,
      userId
    );
  }

  /**
   * Log an external API call
   */
  static logExternalApi(
    service: string,
    provider: string,
    endpoint: string,
    statusCode: number,
    duration: number,
    requestId?: string,
    userId?: string
  ): void {
    this.info(
      service,
      `External API ${provider} ${endpoint} ${statusCode} - ${duration}ms`,
      {
        provider,
        endpoint,
        statusCode,
        duration,
      },
      requestId,
      userId
    );
  }

  /**
   * Generate a correlation ID for request tracking
   */
  static generateCorrelationId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export the generateCorrelationId function separately for easier access
export const generateCorrelationId = LoggerUtil.generateCorrelationId;