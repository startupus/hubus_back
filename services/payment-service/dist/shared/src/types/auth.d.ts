export interface Company {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    isActive: boolean;
    isVerified: boolean;
    role: UserRole;
    description?: string;
    website?: string;
    phone?: string;
    address?: Record<string, unknown>;
    settings?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
    metadata?: Record<string, unknown>;
}
export interface ApiKey {
    id: string;
    key: string;
    companyId: string;
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
    companyId: string;
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
export type UserRole = 'admin' | 'company' | 'service' | 'fsb';
export type Permission = 'read:profile' | 'write:profile' | 'read:billing' | 'write:billing' | 'read:analytics' | 'write:analytics' | 'admin:users' | 'admin:system' | 'api:chat' | 'api:models' | 'api:usage';
export interface AuthContext {
    companyId: string;
    email: string;
    role: UserRole;
    permissions: Permission[];
    apiKeyId?: string;
    sessionId?: string;
}
export interface AuthResult {
    success: boolean;
    company?: Company;
    token?: string;
    refreshToken?: string;
    error?: string;
    requiresVerification?: boolean;
    requiresPasswordReset?: boolean;
}
export interface PasswordResetToken {
    id: string;
    companyId: string;
    token: string;
    expiresAt: Date;
    isUsed: boolean;
    createdAt: Date;
}
export interface EmailVerificationToken {
    id: string;
    companyId: string;
    token: string;
    expiresAt: Date;
    isUsed: boolean;
    createdAt: Date;
}
export interface SecurityEvent {
    id: string;
    companyId?: string;
    type: 'login' | 'logout' | 'password_change' | 'api_key_created' | 'api_key_revoked' | 'suspicious_activity';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
    timestamp: Date;
}
