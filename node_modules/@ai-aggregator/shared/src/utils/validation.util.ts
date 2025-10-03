/**
 * Validation utilities
 */

export class ValidationUtil {
  /**
   * Check if email is valid
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if password meets requirements
   */
  static isValidPassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

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

  /**
   * Check if API key format is valid
   */
  static isValidApiKey(apiKey: string): boolean {
    const apiKeyRegex = /^ak_[A-Za-z0-9]{40}$/;
    return apiKeyRegex.test(apiKey);
  }

  /**
   * Check if UUID is valid
   */
  static isValidUuid(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/[&<>"']/g, (match) => {
        const escapeMap: Record<string, string> = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
        };
        return escapeMap[match] || match;
      });
  }

  /**
   * Validate pagination parameters
   */
  static validatePagination(page?: number, limit?: number): { page: number; limit: number } {
    const validatedPage = Math.max(1, Math.floor(page || 1));
    const validatedLimit = Math.min(100, Math.max(1, Math.floor(limit || 10)));

    return {
      page: validatedPage,
      limit: validatedLimit,
    };
  }

  /**
   * Validate sort parameters
   */
  static validateSort(sortBy?: string, sortOrder?: string): { sortBy?: string; sortOrder: 'asc' | 'desc' } {
    const validSortOrder = ['asc', 'desc'].includes(sortOrder?.toLowerCase() || '') 
      ? (sortOrder?.toLowerCase() as 'asc' | 'desc')
      : 'desc';

    return {
      sortBy: sortBy?.trim() || undefined,
      sortOrder: validSortOrder,
    };
  }
}