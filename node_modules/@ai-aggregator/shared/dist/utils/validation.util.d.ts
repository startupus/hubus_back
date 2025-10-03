/**
 * Validation utilities
 */
export declare class ValidationUtil {
    /**
     * Check if email is valid
     */
    static isValidEmail(email: string): boolean;
    /**
     * Check if password meets requirements
     */
    static isValidPassword(password: string): {
        isValid: boolean;
        errors: string[];
    };
    /**
     * Check if API key format is valid
     */
    static isValidApiKey(apiKey: string): boolean;
    /**
     * Check if UUID is valid
     */
    static isValidUuid(uuid: string): boolean;
    /**
     * Sanitize string input
     */
    static sanitizeString(input: string): string;
    /**
     * Validate pagination parameters
     */
    static validatePagination(page?: number, limit?: number): {
        page: number;
        limit: number;
    };
    /**
     * Validate sort parameters
     */
    static validateSort(sortBy?: string, sortOrder?: string): {
        sortBy?: string;
        sortOrder: 'asc' | 'desc';
    };
}
//# sourceMappingURL=validation.util.d.ts.map