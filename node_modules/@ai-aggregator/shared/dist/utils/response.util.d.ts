/**
 * Response utilities
 */
import { ResponseDto, ErrorDto, ValidationErrorDto } from '../dto/base.dto';
export declare class ResponseUtil {
    /**
     * Create a successful response
     */
    static success<T>(data?: T, message?: string, requestId?: string): ResponseDto<T>;
    /**
     * Create an error response
     */
    static error(error: string, message: string, code?: string, details?: Record<string, unknown>, requestId?: string): ErrorDto;
    /**
     * Create a validation error response
     */
    static validationError(errors: any[], requestId?: string): ValidationErrorDto;
    /**
     * Create a not found error response
     */
    static notFound(resource: string, requestId?: string): ErrorDto;
    /**
     * Create an unauthorized error response
     */
    static unauthorized(message?: string, requestId?: string): ErrorDto;
    /**
     * Create a forbidden error response
     */
    static forbidden(message?: string, requestId?: string): ErrorDto;
    /**
     * Create a bad request error response
     */
    static badRequest(message: string, details?: Record<string, unknown>, requestId?: string): ErrorDto;
    /**
     * Create a rate limit error response
     */
    static rateLimited(retryAfter?: number, requestId?: string): ErrorDto;
    /**
     * Create an internal server error response
     */
    static internalError(message?: string, requestId?: string): ErrorDto;
    /**
     * Create a service unavailable error response
     */
    static serviceUnavailable(service: string, requestId?: string): ErrorDto;
    /**
     * Create a paginated response
     */
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
//# sourceMappingURL=response.util.d.ts.map