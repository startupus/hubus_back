export declare class ValidationUtil {
    static isValidEmail(email: string): boolean;
    static isValidPassword(password: string): {
        isValid: boolean;
        errors: string[];
    };
    static isValidApiKey(apiKey: string): boolean;
    static isValidUuid(uuid: string): boolean;
    static sanitizeString(input: string): string;
    static validatePagination(page?: number, limit?: number): {
        page: number;
        limit: number;
    };
    static validateSort(sortBy?: string, sortOrder?: string): {
        sortBy?: string;
        sortOrder: 'asc' | 'desc';
    };
}
