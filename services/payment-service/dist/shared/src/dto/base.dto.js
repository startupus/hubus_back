"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationErrorDto = exports.ErrorDto = exports.ResponseDto = exports.PaginationDto = exports.BaseDto = void 0;
class BaseDto {
}
exports.BaseDto = BaseDto;
class PaginationDto {
    constructor() {
        this.page = 1;
        this.limit = 10;
        this.sortOrder = 'desc';
    }
}
exports.PaginationDto = PaginationDto;
class ResponseDto {
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
    constructor(error, message, code, details, requestId) {
        this.success = false;
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
    constructor(errors, requestId) {
        super('Validation Error', 'One or more validation errors occurred', 'VALIDATION_ERROR', { errors }, requestId);
        this.code = 'VALIDATION_ERROR';
    }
}
exports.ValidationErrorDto = ValidationErrorDto;
//# sourceMappingURL=base.dto.js.map