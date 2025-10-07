"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const shared_1 = require("@ai-aggregator/shared");
const crypto_util_1 = require("../../common/utils/crypto.util");
let AuthService = class AuthService {
    prisma;
    jwtService;
    configService;
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async register(registerDto) {
        try {
            const existingUser = await this.prisma.user.findUnique({
                where: { email: registerDto.email },
            });
            if (existingUser) {
                throw new common_1.ConflictException('User with this email already exists');
            }
            const passwordHash = await crypto_util_1.CryptoUtil.hashPassword(registerDto.password);
            const user = await this.prisma.user.create({
                data: {
                    email: registerDto.email,
                    passwordHash,
                    firstName: registerDto.firstName,
                    lastName: registerDto.lastName,
                    isVerified: !this.configService.get('REQUIRE_EMAIL_VERIFICATION', false),
                    company: {
                        create: {
                            name: 'Default Company',
                            email: registerDto.email,
                            passwordHash: passwordHash,
                            description: 'Default company for individual users',
                            isActive: true,
                        }
                    }
                },
            });
            const tokens = await this.generateTokens(user);
            await this.logSecurityEvent(user.id, 'USER_CREATED', 'LOW', 'User account created');
            shared_1.LoggerUtil.info('auth-service', 'User registered successfully', { userId: user.id, email: user.email });
            return {
                success: true,
                user: this.mapUserToDto(user),
                token: tokens.accessToken,
                refreshToken: tokens.refreshToken,
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Registration failed', error, { email: registerDto.email });
            throw error;
        }
    }
    async login(loginDto, ipAddress, userAgent) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { email: loginDto.email },
            });
            if (!user) {
                await this.logFailedLoginAttempt(loginDto.email, ipAddress, userAgent, 'User not found');
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            if (!user.isActive) {
                await this.logFailedLoginAttempt(loginDto.email, ipAddress, userAgent, 'Account deactivated');
                throw new common_1.UnauthorizedException('Account is deactivated');
            }
            const isPasswordValid = await crypto_util_1.CryptoUtil.comparePassword(loginDto.password, user.passwordHash);
            if (!isPasswordValid) {
                await this.logFailedLoginAttempt(loginDto.email, ipAddress, userAgent, 'Invalid password');
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            if (this.configService.get('REQUIRE_EMAIL_VERIFICATION', false) && !user.isVerified) {
                return {
                    success: false,
                    error: 'Email verification required',
                    requiresVerification: true,
                };
            }
            const tokens = await this.generateTokens(user);
            await this.prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            });
            await this.logSecurityEvent(user.id, 'LOGIN', 'LOW', 'User logged in successfully', ipAddress, userAgent);
            shared_1.LoggerUtil.info('auth-service', 'User logged in successfully', { userId: user.id, email: user.email });
            return {
                success: true,
                user: this.mapUserToDto(user),
                token: tokens.accessToken,
                refreshToken: tokens.refreshToken,
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Login failed', error, { email: loginDto.email });
            throw error;
        }
    }
    async refreshToken(refreshToken) {
        try {
            const tokenRecord = await this.prisma.refreshToken.findUnique({
                where: { token: refreshToken },
                include: { user: true },
            });
            if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            if (!tokenRecord.user.isActive) {
                throw new common_1.UnauthorizedException('User account is deactivated');
            }
            const tokens = await this.generateTokens(tokenRecord.user);
            await this.prisma.refreshToken.update({
                where: { id: tokenRecord.id },
                data: { isRevoked: true },
            });
            shared_1.LoggerUtil.info('auth-service', 'Token refreshed successfully', { userId: tokenRecord.user.id });
            return tokens;
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Token refresh failed', error);
            throw error;
        }
    }
    async validateToken(token) {
        try {
            const payload = this.jwtService.verify(token);
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });
            if (!user || !user.isActive) {
                return null;
            }
            return payload;
        }
        catch (error) {
            shared_1.LoggerUtil.debug('auth-service', 'Token validation failed', { error: error instanceof Error ? error.message : 'Unknown error' });
            return null;
        }
    }
    async changePassword(userId, changePasswordDto) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                throw new common_1.BadRequestException('User not found');
            }
            const isCurrentPasswordValid = await crypto_util_1.CryptoUtil.comparePassword(changePasswordDto.currentPassword, user.passwordHash);
            if (!isCurrentPasswordValid) {
                throw new common_1.UnauthorizedException('Current password is incorrect');
            }
            const newPasswordHash = await crypto_util_1.CryptoUtil.hashPassword(changePasswordDto.newPassword);
            await this.prisma.user.update({
                where: { id: userId },
                data: { passwordHash: newPasswordHash },
            });
            await this.prisma.refreshToken.updateMany({
                where: { ownerId: userId, ownerType: 'user' },
                data: { isRevoked: true },
            });
            await this.logSecurityEvent(userId, 'PASSWORD_CHANGE', 'MEDIUM', 'Password changed successfully');
            shared_1.LoggerUtil.info('auth-service', 'Password changed successfully', { userId });
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Password change failed', error, { userId });
            throw error;
        }
    }
    async requestPasswordReset(requestPasswordResetDto) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { email: requestPasswordResetDto.email },
            });
            if (!user) {
                return;
            }
            const resetToken = crypto_util_1.CryptoUtil.generatePasswordResetToken();
            await this.prisma.passwordResetToken.create({
                data: {
                    ownerId: user.id,
                    ownerType: 'user',
                    token: resetToken,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                },
            });
            shared_1.LoggerUtil.info('auth-service', 'Password reset requested', { userId: user.id, email: user.email });
            await this.logSecurityEvent(user.id, 'PASSWORD_RESET_REQUESTED', 'MEDIUM', 'Password reset requested');
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Password reset request failed', error, { email: requestPasswordResetDto.email });
            throw error;
        }
    }
    async resetPassword(resetPasswordDto) {
        try {
            const resetToken = await this.prisma.passwordResetToken.findUnique({
                where: { token: resetPasswordDto.token },
                include: { user: true },
            });
            if (!resetToken || resetToken.isUsed || resetToken.expiresAt < new Date()) {
                throw new common_1.BadRequestException('Invalid or expired reset token');
            }
            const newPasswordHash = await crypto_util_1.CryptoUtil.hashPassword(resetPasswordDto.newPassword);
            await this.prisma.$transaction([
                this.prisma.user.update({
                    where: { id: resetToken.user?.id || resetToken.ownerId },
                    data: { passwordHash: newPasswordHash },
                }),
                this.prisma.passwordResetToken.update({
                    where: { id: resetToken.id },
                    data: { isUsed: true },
                }),
            ]);
            await this.prisma.refreshToken.updateMany({
                where: { ownerId: resetToken.user?.id || resetToken.ownerId, ownerType: 'user' },
                data: { isRevoked: true },
            });
            await this.logSecurityEvent(resetToken.user?.id || resetToken.ownerId, 'PASSWORD_RESET', 'HIGH', 'Password reset completed');
            shared_1.LoggerUtil.info('auth-service', 'Password reset completed', { userId: resetToken.user?.id || resetToken.ownerId });
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Password reset failed', error);
            throw error;
        }
    }
    async verifyEmail(verifyEmailDto) {
        try {
            const verificationToken = await this.prisma.emailVerificationToken.findUnique({
                where: { token: verifyEmailDto.token },
                include: { user: true },
            });
            if (!verificationToken || verificationToken.isUsed || verificationToken.expiresAt < new Date()) {
                throw new common_1.BadRequestException('Invalid or expired verification token');
            }
            await this.prisma.$transaction([
                this.prisma.user.update({
                    where: { id: verificationToken.user?.id || verificationToken.ownerId },
                    data: { isVerified: true },
                }),
                this.prisma.emailVerificationToken.update({
                    where: { id: verificationToken.id },
                    data: { isUsed: true },
                }),
            ]);
            await this.logSecurityEvent(verificationToken.user?.id || verificationToken.ownerId, 'EMAIL_VERIFIED', 'LOW', 'Email verified successfully');
            shared_1.LoggerUtil.info('auth-service', 'Email verified successfully', { userId: verificationToken.user?.id || verificationToken.ownerId });
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Email verification failed', error);
            throw error;
        }
    }
    async logout(refreshToken) {
        try {
            await this.prisma.refreshToken.updateMany({
                where: { token: refreshToken },
                data: { isRevoked: true },
            });
            shared_1.LoggerUtil.info('auth-service', 'User logged out successfully');
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Logout failed', error);
            throw error;
        }
    }
    async generateTokens(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            iat: Math.floor(Date.now() / 1000),
        };
        const accessToken = this.jwtService.sign(payload, { expiresIn: '24h' });
        const refreshToken = crypto_util_1.CryptoUtil.generateRefreshToken();
        await this.prisma.refreshToken.create({
            data: {
                ownerId: user.id,
                ownerType: 'user',
                token: refreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
        return { accessToken, refreshToken };
    }
    mapUserToDto(user) {
        return {
            id: user.id,
            email: user.email,
            passwordHash: user.passwordHash,
            isActive: user.isActive,
            isVerified: user.isVerified,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLoginAt: user.lastLoginAt,
            metadata: user.metadata,
        };
    }
    async logFailedLoginAttempt(email, ipAddress, userAgent, reason) {
        try {
            await this.prisma.loginAttempt.create({
                data: {
                    email,
                    ownerType: 'user',
                    ipAddress: ipAddress || 'unknown',
                    userAgent: userAgent || 'unknown',
                    success: false,
                    failureReason: reason,
                },
            });
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to log login attempt', error);
        }
    }
    async logSecurityEvent(userId, type, severity, description, ipAddress, userAgent) {
        try {
            await this.prisma.securityEvent.create({
                data: {
                    ownerId: userId,
                    ownerType: 'user',
                    type: type,
                    severity: severity,
                    description,
                    ipAddress,
                    userAgent,
                },
            });
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to log security event', error);
        }
    }
    async createApiKey(userId, name) {
        try {
            const apiKey = await crypto_util_1.CryptoUtil.generateApiKey();
            const hashedKey = await crypto_util_1.CryptoUtil.hashApiKey(apiKey);
            const keyRecord = await this.prisma.apiKey.create({
                data: {
                    ownerId: userId,
                    ownerType: 'user',
                    name,
                    key: hashedKey,
                    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                },
            });
            shared_1.LoggerUtil.info('auth-service', 'API key created', { userId, keyId: keyRecord.id });
            return {
                success: true,
                message: 'API key created successfully',
                apiKey: {
                    id: keyRecord.id,
                    name: keyRecord.name,
                    key: apiKey,
                    expiresAt: keyRecord.expiresAt,
                    createdAt: keyRecord.createdAt,
                },
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to create API key', error);
            throw new common_1.BadRequestException('Failed to create API key');
        }
    }
    async getApiKeys(userId) {
        try {
            const apiKeys = await this.prisma.apiKey.findMany({
                where: { ownerId: userId, ownerType: 'user', isActive: true },
                select: {
                    id: true,
                    name: true,
                    createdAt: true,
                    expiresAt: true,
                    lastUsedAt: true,
                },
                orderBy: { createdAt: 'desc' },
            });
            return {
                success: true,
                apiKeys,
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to get API keys', error);
            throw new common_1.BadRequestException('Failed to get API keys');
        }
    }
    async revokeApiKey(userId, keyId) {
        try {
            await this.prisma.apiKey.update({
                where: { id: keyId, ownerId: userId, ownerType: 'user' },
                data: { isActive: false },
            });
            shared_1.LoggerUtil.info('auth-service', 'API key revoked', { userId, keyId });
            return {
                success: true,
                message: 'API key revoked successfully',
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to revoke API key', error);
            throw new common_1.BadRequestException('Failed to revoke API key');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map