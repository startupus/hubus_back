import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../../node_modules/.prisma/client';
import { ConfigService } from '@nestjs/config';
import { LoggerUtil } from '@ai-aggregator/shared';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get('AUTH_DATABASE_URL'),
        },
      },
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'info', emit: 'event' },
        { level: 'warn', emit: 'event' },
      ],
    });

    // Log database queries in development
    if (configService.get('NODE_ENV') === 'development') {
      // Skip query logging for now due to type issues
    }

    // Log database errors
    // Skip error logging for now due to type issues
  }

  async onModuleInit() {
    try {
      await this.$connect();
      LoggerUtil.info('auth-service', 'Database connected successfully');
    } catch (error) {
      LoggerUtil.fatal('auth-service', 'Failed to connect to database', error as Error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      LoggerUtil.info('auth-service', 'Database disconnected successfully');
    } catch (error) {
      LoggerUtil.error('auth-service', 'Error disconnecting from database', error as Error);
    }
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      const now = new Date();
      
      // Clean up expired refresh tokens
      const expiredRefreshTokens = await this.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: now,
          },
        },
      });

      // Clean up expired password reset tokens
      const expiredPasswordResetTokens = await this.passwordResetToken.deleteMany({
        where: {
          expiresAt: {
            lt: now,
          },
        },
      });

      // Clean up expired email verification tokens
      const expiredEmailVerificationTokens = await this.emailVerificationToken.deleteMany({
        where: {
          expiresAt: {
            lt: now,
          },
        },
      });

      LoggerUtil.info(
        'auth-service',
        'Cleaned up expired tokens',
        {
          refreshTokens: expiredRefreshTokens.count,
          passwordResetTokens: expiredPasswordResetTokens.count,
          emailVerificationTokens: expiredEmailVerificationTokens.count,
        }
      );
    } catch (error) {
      LoggerUtil.error('auth-service', 'Error cleaning up expired tokens', error as Error);
    }
  }

  /**
   * Get database health status
   */
  async getHealthStatus(): Promise<{ status: 'healthy' | 'unhealthy'; responseTime?: number; error?: string }> {
    const start = Date.now();
    try {
      await this.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
