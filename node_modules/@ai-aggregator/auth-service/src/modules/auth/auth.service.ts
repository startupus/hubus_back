import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoggerUtil, User, AuthResult, JwtPayload } from '@ai-aggregator/shared';
import { CryptoUtil } from '../../common/utils/crypto.util';
import { RegisterDto, LoginDto, ChangePasswordDto, ResetPasswordRequestDto, ResetPasswordDto, VerifyEmailDto } from '@ai-aggregator/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto): Promise<AuthResult> {
    try {
      // Check if company already exists
      const existingCompany = await this.prisma.company.findUnique({
        where: { email: registerDto.email },
      });

      if (existingCompany) {
        throw new ConflictException('Company with this email already exists');
      }

      // Hash password
      const passwordHash = await CryptoUtil.hashPassword(registerDto.password);

      // Create company
      const company = await this.prisma.company.create({
        data: {
          name: registerDto.firstName ? `${registerDto.firstName}'s Company` : 'Default Company',
          email: registerDto.email,
          passwordHash: passwordHash,
          description: 'Default company for individual users',
          isActive: true,
          isVerified: !this.configService.get('REQUIRE_EMAIL_VERIFICATION', false),
          role: 'company',
        },
      });

      // Generate tokens
      const tokens = await this.generateTokens(company as any);

      // Log security event
      await this.logSecurityEvent(company.id, 'USER_CREATED', 'LOW', 'Company account created');

      LoggerUtil.info('auth-service', 'Company registered successfully', { companyId: company.id, email: company.email });

      return {
        success: true,
        user: this.mapCompanyToDto(company),
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      LoggerUtil.error('auth-service', 'Registration failed', error as Error, { email: registerDto.email });
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    try {
      // Find company
      const company = await this.prisma.company.findUnique({
        where: { email: loginDto.email },
      });

      if (!company) {
        await this.logFailedLoginAttempt(loginDto.email, ipAddress, userAgent, 'Company not found');
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if company is active
      if (!company.isActive) {
        await this.logFailedLoginAttempt(loginDto.email, ipAddress, userAgent, 'Account deactivated');
        throw new UnauthorizedException('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await CryptoUtil.comparePassword(loginDto.password, company.passwordHash);
      if (!isPasswordValid) {
        await this.logFailedLoginAttempt(loginDto.email, ipAddress, userAgent, 'Invalid password');
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if email verification is required
      if (this.configService.get('REQUIRE_EMAIL_VERIFICATION', false) && !company.isVerified) {
        return {
          success: false,
          error: 'Email verification required',
          requiresVerification: true,
        };
      }

      // Generate tokens
      const tokens = await this.generateTokens(company as any);

      // Update last login
      await this.prisma.company.update({
        where: { id: company.id },
        data: { lastLoginAt: new Date() },
      });

      // Log successful login
      await this.logSecurityEvent(company.id, 'LOGIN', 'LOW', 'Company logged in successfully', ipAddress, userAgent);

      LoggerUtil.info('auth-service', 'Company logged in successfully', { companyId: company.id, email: company.email });

      return {
        success: true,
        user: this.mapCompanyToDto(company),
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      LoggerUtil.error('auth-service', 'Login failed', error as Error, { email: loginDto.email });
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Find refresh token
      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { company: true },
      });

      if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if user is still active
      if (!tokenRecord.company.isActive) {
        throw new UnauthorizedException('Company account is deactivated');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(tokenRecord.company as any);

      // Revoke old refresh token
      await this.prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { isRevoked: true },
      });

      LoggerUtil.info('auth-service', 'Token refreshed successfully', { companyId: tokenRecord.company.id });

      return tokens;
    } catch (error) {
      LoggerUtil.error('auth-service', 'Token refresh failed', error as Error);
      throw error;
    }
  }

  /**
   * Validate JWT token
   */
  async validateToken(token: string): Promise<JwtPayload | null> {
    try {
      const payload = this.jwtService.verify(token) as JwtPayload;
      
      // Check if company still exists and is active
      const company = await this.prisma.company.findUnique({
        where: { id: payload.sub },
      });

      if (!company || !company.isActive) {
        return null;
      }

      return payload;
    } catch (error) {
      LoggerUtil.debug('auth-service', 'Token validation failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    try {
      const company = await this.prisma.company.findUnique({
        where: { id: userId },
      });

      if (!company) {
        throw new BadRequestException('Company not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await CryptoUtil.comparePassword(
        changePasswordDto.currentPassword,
        company.passwordHash
      );

      if (!isCurrentPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      // Hash new password
      const newPasswordHash = await CryptoUtil.hashPassword(changePasswordDto.newPassword);

      // Update password
      await this.prisma.company.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      });

      // Revoke all refresh tokens
      await this.prisma.refreshToken.updateMany({
        where: { companyId: userId },
        data: { isRevoked: true },
      });

      // Log security event
      await this.logSecurityEvent(userId, 'PASSWORD_CHANGE', 'MEDIUM', 'Password changed successfully');

      LoggerUtil.info('auth-service', 'Password changed successfully', { userId });
    } catch (error) {
      LoggerUtil.error('auth-service', 'Password change failed', error as Error, { userId });
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(requestPasswordResetDto: ResetPasswordRequestDto): Promise<void> {
    try {
      const company = await this.prisma.company.findUnique({
        where: { email: requestPasswordResetDto.email },
      });

      if (!company) {
        // Don't reveal if company exists or not
        return;
      }

      // Generate reset token
      const resetToken = CryptoUtil.generatePasswordResetToken();

      // Save reset token
      await this.prisma.passwordResetToken.create({
        data: {
          companyId: company.id,
          token: resetToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      // TODO: Send email with reset token
      LoggerUtil.info('auth-service', 'Password reset requested', { companyId: company.id, email: company.email });

      // Log security event
      await this.logSecurityEvent(company.id, 'PASSWORD_RESET_REQUESTED', 'MEDIUM', 'Password reset requested');
    } catch (error) {
      LoggerUtil.error('auth-service', 'Password reset request failed', error as Error, { email: requestPasswordResetDto.email });
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    try {
      // Find reset token
      const resetToken = await this.prisma.passwordResetToken.findUnique({
        where: { token: resetPasswordDto.token },
        include: { company: true },
      });

      if (!resetToken || resetToken.isUsed || resetToken.expiresAt < new Date()) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      // Hash new password
      const newPasswordHash = await CryptoUtil.hashPassword(resetPasswordDto.newPassword);

      // Update password and mark token as used
      await this.prisma.$transaction([
        this.prisma.company.update({
          where: { id: resetToken.companyId },
          data: { passwordHash: newPasswordHash },
        }),
        this.prisma.passwordResetToken.update({
          where: { id: resetToken.id },
          data: { isUsed: true },
        }),
      ]);

      // Revoke all refresh tokens
      await this.prisma.refreshToken.updateMany({
        where: { companyId: resetToken.companyId },
        data: { isRevoked: true },
      });

      // Log security event
      await this.logSecurityEvent(resetToken.companyId, 'PASSWORD_RESET', 'HIGH', 'Password reset completed');

      LoggerUtil.info('auth-service', 'Password reset completed', { companyId: resetToken.companyId });
    } catch (error) {
      LoggerUtil.error('auth-service', 'Password reset failed', error as Error);
      throw error;
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<void> {
    try {
      // Find verification token
      const verificationToken = await this.prisma.emailVerificationToken.findUnique({
        where: { token: verifyEmailDto.token },
        include: { company: true },
      });

      if (!verificationToken || verificationToken.isUsed || verificationToken.expiresAt < new Date()) {
        throw new BadRequestException('Invalid or expired verification token');
      }

      // Mark email as verified and token as used
      await this.prisma.$transaction([
        this.prisma.company.update({
          where: { id: verificationToken.companyId },
          data: { isVerified: true },
        }),
        this.prisma.emailVerificationToken.update({
          where: { id: verificationToken.id },
          data: { isUsed: true },
        }),
      ]);

      // Log security event
      await this.logSecurityEvent(verificationToken.companyId, 'EMAIL_VERIFIED', 'LOW', 'Email verified successfully');

      LoggerUtil.info('auth-service', 'Email verified successfully', { companyId: verificationToken.companyId });
    } catch (error) {
      LoggerUtil.error('auth-service', 'Email verification failed', error as Error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      // Revoke refresh token
      await this.prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { isRevoked: true },
      });

      LoggerUtil.info('auth-service', 'User logged out successfully');
    } catch (error) {
      LoggerUtil.error('auth-service', 'Logout failed', error as Error);
      throw error;
    }
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '24h' });
    const refreshToken = CryptoUtil.generateRefreshToken();

    // Save refresh token
    await this.prisma.refreshToken.create({
      data: {
        companyId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return { accessToken, refreshToken };
  }

  /**
   * Map Prisma company to DTO
   */
  private mapCompanyToDto(company: any): User {
    return {
      id: company.id,
      email: company.email,
      passwordHash: company.passwordHash,
      isActive: company.isActive,
      isVerified: company.isVerified,
      role: company.role,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      lastLoginAt: company.lastLoginAt,
      metadata: company.metadata,
    };
  }

  /**
   * Log failed login attempt
   */
  private async logFailedLoginAttempt(email: string, ipAddress?: string, userAgent?: string, reason?: string): Promise<void> {
    try {
      await this.prisma.loginAttempt.create({
        data: {
          email,
          ipAddress: ipAddress || 'unknown',
          userAgent: userAgent || 'unknown',
          success: false,
          failureReason: reason,
        },
      });
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to log login attempt', error as Error);
    }
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(
    companyId: string,
    type: string,
    severity: string,
    description: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await this.prisma.securityEvent.create({
        data: {
          companyId: companyId,
          type: type as any,
          severity: severity as any,
          description,
          ipAddress,
          userAgent,
        },
      });
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to log security event', error as Error);
    }
  }

  /**
   * Create API key for user
   */
  async createApiKey(userId: string, name: string): Promise<any> {
    try {
      const apiKey = await CryptoUtil.generateApiKey();
      const hashedKey = await CryptoUtil.hashApiKey(apiKey);
      
      const keyRecord = await this.prisma.apiKey.create({
        data: {
          companyId: userId,
          name,
          key: hashedKey,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
      });

      LoggerUtil.info('auth-service', 'API key created', { userId, keyId: keyRecord.id });
      
      return {
        success: true,
        message: 'API key created successfully',
        apiKey: {
          id: keyRecord.id,
          name: keyRecord.name,
          key: apiKey, // Only returned once
          expiresAt: keyRecord.expiresAt,
          createdAt: keyRecord.createdAt,
        },
      };
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to create API key', error as Error);
      throw new BadRequestException('Failed to create API key');
    }
  }

  /**
   * Get user API keys
   */
  async getApiKeys(userId: string): Promise<any> {
    try {
      const apiKeys = await this.prisma.apiKey.findMany({
        where: { companyId: userId, isActive: true },
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
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to get API keys', error as Error);
      throw new BadRequestException('Failed to get API keys');
    }
  }

  /**
   * Revoke API key
   */
  async revokeApiKey(userId: string, keyId: string): Promise<any> {
    try {
      await this.prisma.apiKey.update({
        where: { id: keyId, companyId: userId },
        data: { isActive: false },
      });

      LoggerUtil.info('auth-service', 'API key revoked', { userId, keyId });
      
      return {
        success: true,
        message: 'API key revoked successfully',
      };
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to revoke API key', error as Error);
      throw new BadRequestException('Failed to revoke API key');
    }
  }
}
