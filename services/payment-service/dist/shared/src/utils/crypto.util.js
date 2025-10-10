"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoUtil = void 0;
class CryptoUtil {
    static generateSecureString(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    static generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    static generateApiKey() {
        const prefix = 'ak_';
        const randomPart = this.generateSecureString(40);
        return `${prefix}${randomPart}`;
    }
    static generateRefreshToken() {
        return this.generateSecureString(64);
    }
    static generatePasswordResetToken() {
        return this.generateSecureString(32);
    }
    static generateEmailVerificationToken() {
        return this.generateSecureString(32);
    }
    static createRateLimitHash(identifier, window) {
        const data = `${identifier}:${window}`;
        return this.simpleHash(data);
    }
    static simpleHash(str) {
        let hash = 0;
        if (str.length === 0)
            return hash.toString();
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }
}
exports.CryptoUtil = CryptoUtil;
//# sourceMappingURL=crypto.util.js.map