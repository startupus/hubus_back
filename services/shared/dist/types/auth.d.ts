/**
 * Authentication and authorization types
 */
export interface User {
    id: string;
    email: string;
    passwordHash: string;
    isActive: boolean;
    isVerified: boolean;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
    metadata?: Record<string, unknown>;
}
export interface ApiKey {
    id: string;
    key: string;
    userId: string;
    name: string;
    description?: string;
    isActive: boolean;
    permissions: Permission[];
    lastUsedAt?: Date;
    expiresAt?: Date;
    createdAt: Date;
    metadata?: Record<string, unknown>;
}
export interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
    iat: number;
    exp?: number;
    jti?: string;
}
export interface RefreshToken {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    isRevoked: boolean;
    createdAt: Date;
    lastUsedAt?: Date;
    userAgent?: string;
    ipAddress?: string;
}
export interface LoginAttempt {
    id: string;
    email: string;
    ipAddress: string;
    userAgent: string;
    success: boolean;
    failureReason?: string;
    timestamp: Date;
}
export type UserRole = 'admin' | 'user' | 'service';
export type Permission = 'read:profile' | 'write:profile' | 'read:billing' | 'write:billing' | 'read:analytics' | 'write:analytics' | 'admin:users' | 'admin:system' | 'api:chat' | 'api:models' | 'api:usage';
export interface AuthContext {
    userId: string;
    email: string;
    role: UserRole;
    permissions: Permission[];
    apiKeyId?: string;
    sessionId?: string;
}
export interface AuthResult {
    success: boolean;
    user?: User;
    token?: string;
    refreshToken?: string;
    error?: string;
    requiresVerification?: boolean;
    requiresPasswordReset?: boolean;
}
export interface PasswordResetToken {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    isUsed: boolean;
    createdAt: Date;
}
export interface EmailVerificationToken {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    isUsed: boolean;
    createdAt: Date;
}
export interface SecurityEvent {
    id: string;
    userId?: string;
    type: 'login' | 'logout' | 'password_change' | 'api_key_created' | 'api_key_revoked' | 'suspicious_activity';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
    timestamp: Date;
}
//# sourceMappingURL=auth.d.ts.map