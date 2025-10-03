"use strict";
/**
 * Base DTO classes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationErrorDto = exports.ErrorDto = exports.ResponseDto = exports.PaginationDto = exports.BaseDto = void 0;
class BaseDto {
    id;
    createdAt;
    updatedAt;
}
exports.BaseDto = BaseDto;
class PaginationDto {
    page = 1;
    limit = 10;
    sortBy;
    sortOrder = 'desc';
}
exports.PaginationDto = PaginationDto;
class ResponseDto {
    success;
    data;
    message;
    error;
    timestamp;
    requestId;
    constructor(data, message, requestId) {
        this.success = true;
        this.data = data;
        this.message = message;
        this.timestamp = new Date().toISOString();
        this.requestId = requestId;
    }
}
exports.ResponseDto = ResponseDto;
class ErrorDto {
    success = false;
    error;
    message;
    code;
    details;
    timestamp;
    requestId;
    constructor(error, message, code, details, requestId) {
        this.success = false;
        this.error = error;
        this.message = message;
        this.code = code;
        this.details = details;
        this.timestamp = new Date().toISOString();
        this.requestId = requestId;
    }
}
exports.ErrorDto = ErrorDto;
class ValidationErrorDto extends ErrorDto {
    code = 'VALIDATION_ERROR';
    constructor(errors, requestId) {
        super('Validation Error', 'One or more validation errors occurred', 'VALIDATION_ERROR', { errors }, requestId);
    }
}
exports.ValidationErrorDto = ValidationErrorDto;
//# sourceMappingURL=base.dto.js.map