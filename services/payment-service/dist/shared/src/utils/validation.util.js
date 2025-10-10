"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationUtil = void 0;
class ValidationUtil {
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    static isValidPassword(password) {
        const errors = [];
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        if (password.length > 128) {
            errors.push('Password must be no more than 128 characters long');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
    static isValidApiKey(apiKey) {
        const apiKeyRegex = /^ak_[A-Za-z0-9]{40}$/;
        return apiKeyRegex.test(apiKey);
    }
    static isValidUuid(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }
    static sanitizeString(input) {
        return input
            .trim()
            .replace(/[<>]/g, '')
            .replace(/[&<>"']/g, (match) => {
            const escapeMap = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#x27;',
            };
            return escapeMap[match] || match;
        });
    }
    static validatePagination(page, limit) {
        const validatedPage = Math.max(1, Math.floor(page || 1));
        const validatedLimit = Math.min(100, Math.max(1, Math.floor(limit || 10)));
        return {
            page: validatedPage,
            limit: validatedLimit,
        };
    }
    static validateSort(sortBy, sortOrder) {
        const validSortOrder = ['asc', 'desc'].includes(sortOrder?.toLowerCase() || '')
            ? sortOrder?.toLowerCase()
            : 'desc';
        return {
            sortBy: sortBy?.trim() || undefined,
            sortOrder: validSortOrder,
        };
    }
}
exports.ValidationUtil = ValidationUtil;
//# sourceMappingURL=validation.util.js.map