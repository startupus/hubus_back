"use strict";
/**
 * Cryptographic utilities
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoUtil = void 0;
const bcrypt = __importStar(require("bcrypt"));
const jwt = __importStar(require("jsonwebtoken"));
const uuid_1 = require("uuid");
class CryptoUtil {
    static SALT_ROUNDS = 12;
    static JWT_SECRET = process.env['JWT_SECRET'] || 'default-secret';
    /**
     * Hash a password using bcrypt
     */
    static async hashPassword(password) {
        return bcrypt.hash(password, this.SALT_ROUNDS);
    }
    /**
     * Compare a password with its hash
     */
    static async comparePassword(password, hash) {
        return bcrypt.compare(password, hash);
    }
    /**
     * Generate a JWT token
     */
    static generateToken(payload, expiresIn = '24h') {
        return jwt.sign(payload, this.JWT_SECRET, { expiresIn });
    }
    /**
     * Verify a JWT token
     */
    static verifyToken(token) {
        try {
            return jwt.verify(token, this.JWT_SECRET);
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Generate a secure random string
     */
    static generateSecureString(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    /**
     * Generate a UUID v4
     */
    static generateId() {
        return (0, uuid_1.v4)();
    }
    /**
     * Generate an API key
     */
    static generateApiKey() {
        const prefix = 'ak_';
        const randomPart = this.generateSecureString(40);
        return `${prefix}${randomPart}`;
    }
    /**
     * Generate a refresh token
     */
    static generateRefreshToken() {
        return this.generateSecureString(64);
    }
    /**
     * Generate a password reset token
     */
    static generatePasswordResetToken() {
        return this.generateSecureString(32);
    }
    /**
     * Generate an email verification token
     */
    static generateEmailVerificationToken() {
        return this.generateSecureString(32);
    }
    /**
     * Create a hash for rate limiting
     */
    static createRateLimitHash(identifier, window) {
        const data = `${identifier}:${window}`;
        return this.simpleHash(data);
    }
    /**
     * Simple hash function for non-cryptographic purposes
     */
    static simpleHash(str) {
        let hash = 0;
        if (str.length === 0)
            return hash.toString();
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }
}
exports.CryptoUtil = CryptoUtil;
//# sourceMappingURL=crypto.util.js.map