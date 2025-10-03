/**
 * Base DTO classes
 */

export class BaseDto {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class PaginationDto {
  page?: number = 1;
  limit?: number = 10;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class ResponseDto<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
  requestId?: string;

  constructor(data?: T, message?: string, requestId?: string) {
    this.success = true;
    this.data = data;
    this.message = message;
    this.timestamp = new Date().toISOString();
    this.requestId = requestId;
  }
}

export class ErrorDto {
  success: boolean = false;
  error: string;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp: string;
  requestId?: string;

  constructor(error: string, message: string, code?: string, details?: Record<string, unknown>, requestId?: string) {
    this.success = false;
    this.error = error;
    this.message = message;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.requestId = requestId;
  }
}

export class ValidationErrorDto extends ErrorDto {
  code: string = 'VALIDATION_ERROR';
  declare details?: {
    errors: Array<{
      field: string;
      message: string;
      value?: unknown;
    }>;
  };

  constructor(errors: Array<{ field: string; message: string; value?: unknown }>, requestId?: string) {
    super('Validation Error', 'One or more validation errors occurred', 'VALIDATION_ERROR', { errors }, requestId);
  }
}