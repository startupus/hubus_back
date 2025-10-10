import { ResponseDto, ErrorDto, ValidationErrorDto } from '../dto/base.dto';
export declare class ResponseUtil {
    static success<T>(data?: T, message?: string, requestId?: string): ResponseDto<T>;
    static error(error: string, message: string, code?: string, details?: Record<string, unknown>, requestId?: string): ErrorDto;
    static validationError(errors: any[], requestId?: string): ValidationErrorDto;
    static notFound(resource: string, requestId?: string): ErrorDto;
    static unauthorized(message?: string, requestId?: string): ErrorDto;
    static forbidden(message?: string, requestId?: string): ErrorDto;
    static badRequest(message: string, details?: Record<string, unknown>, requestId?: string): ErrorDto;
    static rateLimited(retryAfter?: number, requestId?: string): ErrorDto;
    static internalError(message?: string, requestId?: string): ErrorDto;
    static serviceUnavailable(service: string, requestId?: string): ErrorDto;
    static paginated<T>(data: T[], page: number, limit: number, total: number, requestId?: string): ResponseDto<{
        data: T[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
}
