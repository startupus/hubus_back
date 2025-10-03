import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CryptoUtil, LoggerUtil, User, AuthResult, JwtPayload } from '@ai-aggregator/shared';
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
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: registerDto.email },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Hash password
      const passwordHash = await CryptoUtil.hashPassword(registerDto.password);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          email: registerDto.email,
          passwordHash,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          isVerified: !this.configService.get('REQUIRE_EMAIL_VERIFICATION', false),
        },
      });

      // Generate tokens
      const tokens = await this.generateTokens(user as any);

      // Log security event
      await this.logSecurityEvent(user.id, 'USER_CREATED', 'LOW', 'User account created');

      LoggerUtil.info('auth-service', 'User registered successfully', { userId: user.id, email: user.email });

      return {
        success: true,
        user: this.mapUserToDto(user),
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
      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email: loginDto.email },
      });

      if (!user) {
        await this.logFailedLoginAttempt(loginDto.email, ipAddress, userAgent, 'User not found');
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if user is active
      if (!user.isActive) {
        await this.logFailedLoginAttempt(loginDto.email, ipAddress, userAgent, 'Account deactivated');
        throw new UnauthorizedException('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await CryptoUtil.comparePassword(loginDto.password, user.passwordHash);
      if (!isPasswordValid) {
        await this.logFailedLoginAttempt(loginDto.email, ipAddress, userAgent, 'Invalid password');
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if email verification is required
      if (this.configService.get('REQUIRE_EMAIL_VERIFICATION', false) && !user.isVerified) {
        return {
          success: false,
          error: 'Email verification required',
          requiresVerification: true,
        };
      }

      // Generate tokens
      const tokens = await this.generateTokens(user as any);

      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Log successful login
      await this.logSecurityEvent(user.id, 'LOGIN', 'LOW', 'User logged in successfully', ipAddress, userAgent);

      LoggerUtil.info('auth-service', 'User logged in successfully', { userId: user.id, email: user.email });

      return {
        success: true,
        user: this.mapUserToDto(user),
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
        include: { user: true },
      });

      if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if user is still active
      if (!tokenRecord.user.isActive) {
        throw new UnauthorizedException('User account is deactivated');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(tokenRecord.user as any);

      // Revoke old refresh token
      await this.prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { isRevoked: true },
      });

      LoggerUtil.info('auth-service', 'Token refreshed successfully', { userId: tokenRecord.user.id });

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
      
      // Check if user still exists and is active
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
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
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await CryptoUtil.comparePassword(
        changePasswordDto.currentPassword,
        user.passwordHash
      );

      if (!isCurrentPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      // Hash new password
      const newPasswordHash = await CryptoUtil.hashPassword(changePasswordDto.newPassword);

      // Update password
      await this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      });

      // Revoke all refresh tokens
      await this.prisma.refreshToken.updateMany({
        where: { userId },
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
      const user = await this.prisma.user.findUnique({
        where: { email: requestPasswordResetDto.email },
      });

      if (!user) {
        // Don't reveal if user exists or not
        return;
      }

      // Generate reset token
      const resetToken = CryptoUtil.generatePasswordResetToken();

      // Save reset token
      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: resetToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      // TODO: Send email with reset token
      LoggerUtil.info('auth-service', 'Password reset requested', { userId: user.id, email: user.email });

      // Log security event
      await this.logSecurityEvent(user.id, 'PASSWORD_RESET_REQUESTED', 'MEDIUM', 'Password reset requested');
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
        include: { user: true },
      });

      if (!resetToken || resetToken.isUsed || resetToken.expiresAt < new Date()) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      // Hash new password
      const newPasswordHash = await CryptoUtil.hashPassword(resetPasswordDto.newPassword);

      // Update password and mark token as used
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: resetToken.userId },
          data: { passwordHash: newPasswordHash },
        }),
        this.prisma.passwordResetToken.update({
          where: { id: resetToken.id },
          data: { isUsed: true },
        }),
      ]);

      // Revoke all refresh tokens
      await this.prisma.refreshToken.updateMany({
        where: { userId: resetToken.userId },
        data: { isRevoked: true },
      });

      // Log security event
      await this.logSecurityEvent(resetToken.userId, 'PASSWORD_RESET', 'HIGH', 'Password reset completed');

      LoggerUtil.info('auth-service', 'Password reset completed', { userId: resetToken.userId });
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
        include: { user: true },
      });

      if (!verificationToken || verificationToken.isUsed || verificationToken.expiresAt < new Date()) {
        throw new BadRequestException('Invalid or expired verification token');
      }

      // Mark email as verified and token as used
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: verificationToken.userId },
          data: { isVerified: true },
        }),
        this.prisma.emailVerificationToken.update({
          where: { id: verificationToken.id },
          data: { isUsed: true },
        }),
      ]);

      // Log security event
      await this.logSecurityEvent(verificationToken.userId, 'EMAIL_VERIFIED', 'LOW', 'Email verified successfully');

      LoggerUtil.info('auth-service', 'Email verified successfully', { userId: verificationToken.userId });
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
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return { accessToken, refreshToken };
  }

  /**
   * Map Prisma user to DTO
   */
  private mapUserToDto(user: any): User {
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
    userId: string,
    type: string,
    severity: string,
    description: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await this.prisma.securityEvent.create({
        data: {
          userId,
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
}
