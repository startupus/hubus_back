"use strict";
/**
 * Response utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseUtil = void 0;
const base_dto_1 = require("../dto/base.dto");
class ResponseUtil {
    /**
     * Create a successful response
     */
    static success(data, message, requestId) {
        return new base_dto_1.ResponseDto(data, message, requestId);
    }
    /**
     * Create an error response
     */
    static error(error, message, code, details, requestId) {
        return new base_dto_1.ErrorDto(error, message, code, details, requestId);
    }
    /**
     * Create a validation error response
     */
    static validationError(errors, requestId) {
        const formattedErrors = errors.map(error => ({
            field: error.property || error.field,
            message: error.constraints ? Object.values(error.constraints)[0] : error.message || 'Invalid value',
            value: error.value,
        }));
        return new base_dto_1.ValidationErrorDto(formattedErrors, requestId);
    }
    /**
     * Create a not found error response
     */
    static notFound(resource, requestId) {
        return new base_dto_1.ErrorDto('Not Found', `${resource} not found`, 'NOT_FOUND', undefined, requestId);
    }
    /**
     * Create an unauthorized error response
     */
    static unauthorized(message = 'Unauthorized', requestId) {
        return new base_dto_1.ErrorDto('Unauthorized', message, 'UNAUTHORIZED', undefined, requestId);
    }
    /**
     * Create a forbidden error response
     */
    static forbidden(message = 'Forbidden', requestId) {
        return new base_dto_1.ErrorDto('Forbidden', message, 'FORBIDDEN', undefined, requestId);
    }
    /**
     * Create a bad request error response
     */
    static badRequest(message, details, requestId) {
        return new base_dto_1.ErrorDto('Bad Request', message, 'BAD_REQUEST', details, requestId);
    }
    /**
     * Create a rate limit error response
     */
    static rateLimited(retryAfter, requestId) {
        return new base_dto_1.ErrorDto('Rate Limited', 'Too many requests', 'RATE_LIMITED', retryAfter ? { retryAfter } : undefined, requestId);
    }
    /**
     * Create an internal server error response
     */
    static internalError(message = 'Internal Server Error', requestId) {
        return new base_dto_1.ErrorDto('Internal Server Error', message, 'INTERNAL_ERROR', undefined, requestId);
    }
    /**
     * Create a service unavailable error response
     */
    static serviceUnavailable(service, requestId) {
        return new base_dto_1.ErrorDto('Service Unavailable', `${service} is currently unavailable`, 'SERVICE_UNAVAILABLE', { service }, requestId);
    }
    /**
     * Create a paginated response
     */
    static paginated(data, page, limit, total, requestId) {
        const totalPages = Math.ceil(total / limit);
        return new base_dto_1.ResponseDto({
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        }, undefined, requestId);
    }
}
exports.ResponseUtil = ResponseUtil;
//# sourceMappingURL=response.util.js.map