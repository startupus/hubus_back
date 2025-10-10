export declare class BaseDto {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
}
export declare class PaginationDto {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export declare class ResponseDto<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    timestamp: string;
    requestId?: string;
    constructor(data?: T, message?: string, requestId?: string);
}
export declare class ErrorDto {
    success: boolean;
    error: string;
    message: string;
    code?: string;
    details?: Record<string, unknown>;
    timestamp: string;
    requestId?: string;
    constructor(error: string, message: string, code?: string, details?: Record<string, unknown>, requestId?: string);
}
export declare class ValidationErrorDto extends ErrorDto {
    code: string;
    details?: {
        errors: Array<{
            field: string;
            message: string;
            value?: unknown;
        }>;
    };
    constructor(errors: Array<{
        field: string;
        message: string;
        value?: unknown;
    }>, requestId?: string);
}
