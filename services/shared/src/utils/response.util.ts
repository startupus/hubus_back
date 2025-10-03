/**
 * Response utilities
 */

import { ResponseDto, ErrorDto, ValidationErrorDto } from '../dto/base.dto';
import { ValidationError } from 'class-validator';

export class ResponseUtil {
  /**
   * Create a successful response
   */
  static success<T>(data?: T, message?: string, requestId?: string): ResponseDto<T> {
    return new ResponseDto(data, message, requestId);
  }

  /**
   * Create an error response
   */
  static error(
    error: string,
    message: string,
    code?: string,
    details?: Record<string, unknown>,
    requestId?: string
  ): ErrorDto {
    return new ErrorDto(error, message, code, details, requestId);
  }

  /**
   * Create a validation error response
   */
  static validationError(
    errors: any[],
    requestId?: string
  ): ValidationErrorDto {
    const formattedErrors = errors.map(error => ({
      field: error.property || error.field,
      message: error.constraints ? Object.values(error.constraints)[0] : error.message || 'Invalid value',
      value: error.value,
    }));

    return new ValidationErrorDto(formattedErrors, requestId);
  }

  /**
   * Create a not found error response
   */
  static notFound(resource: string, requestId?: string): ErrorDto {
    return new ErrorDto(
      'Not Found',
      `${resource} not found`,
      'NOT_FOUND',
      undefined,
      requestId
    );
  }

  /**
   * Create an unauthorized error response
   */
  static unauthorized(message: string = 'Unauthorized', requestId?: string): ErrorDto {
    return new ErrorDto(
      'Unauthorized',
      message,
      'UNAUTHORIZED',
      undefined,
      requestId
    );
  }

  /**
   * Create a forbidden error response
   */
  static forbidden(message: string = 'Forbidden', requestId?: string): ErrorDto {
    return new ErrorDto(
      'Forbidden',
      message,
      'FORBIDDEN',
      undefined,
      requestId
    );
  }

  /**
   * Create a bad request error response
   */
  static badRequest(message: string, details?: Record<string, unknown>, requestId?: string): ErrorDto {
    return new ErrorDto(
      'Bad Request',
      message,
      'BAD_REQUEST',
      details,
      requestId
    );
  }

  /**
   * Create a rate limit error response
   */
  static rateLimited(retryAfter?: number, requestId?: string): ErrorDto {
    return new ErrorDto(
      'Rate Limited',
      'Too many requests',
      'RATE_LIMITED',
      retryAfter ? { retryAfter } : undefined,
      requestId
    );
  }

  /**
   * Create an internal server error response
   */
  static internalError(message: string = 'Internal Server Error', requestId?: string): ErrorDto {
    return new ErrorDto(
      'Internal Server Error',
      message,
      'INTERNAL_ERROR',
      undefined,
      requestId
    );
  }

  /**
   * Create a service unavailable error response
   */
  static serviceUnavailable(service: string, requestId?: string): ErrorDto {
    return new ErrorDto(
      'Service Unavailable',
      `${service} is currently unavailable`,
      'SERVICE_UNAVAILABLE',
      { service },
      requestId
    );
  }

  /**
   * Create a paginated response
   */
  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    requestId?: string
  ): ResponseDto<{
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const totalPages = Math.ceil(total / limit);
    
    return new ResponseDto(
      {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
      undefined,
      requestId
    );
  }
}
