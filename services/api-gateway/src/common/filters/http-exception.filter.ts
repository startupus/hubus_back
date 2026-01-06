import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerUtil } from '@ai-aggregator/shared';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorDetails: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message || message;
        errorDetails = responseObj;
      } else {
        message = exception.message || message;
      }
    } else if (exception instanceof Error) {
      message = exception.message || message;
      errorDetails = {
        name: exception.name,
        stack: process.env.NODE_ENV !== 'production' ? exception.stack : undefined,
      };
    }

    // Логируем ошибку
    LoggerUtil.error(
      'api-gateway',
      `HTTP Exception: ${message}`,
      exception instanceof Error ? exception : new Error(String(exception)),
      {
        status,
        path: request.url,
        method: request.method,
        userId: (request as any).user?.id,
        errorDetails,
      }
    );

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(errorDetails && Object.keys(errorDetails).length > 0 && { error: errorDetails }),
    };

    response.status(status).json(errorResponse);
  }
}



