import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoggerUtil, SecurityEvent } from '@ai-aggregator/shared';

@Injectable()
export class SecurityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get security events for a user
   */
  async getUserSecurityEvents(userId: string, page: number = 1, limit: number = 10): Promise<{ events: SecurityEvent[]; total: number }> {
    try {
      const skip = (page - 1) * limit;

      const [events, total] = await Promise.all([
        this.prisma.securityEvent.findMany({
          where: { ownerId: userId, ownerType: 'user' },
          skip,
          take: limit,
          orderBy: { timestamp: 'desc' },
        }),
        this.prisma.securityEvent.count({
          where: { ownerId: userId, ownerType: 'user' },
        }),
      ]);

      return {
        events: events.map(event => this.mapSecurityEventToDto(event)),
        total,
      };
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to get security events', error as Error, { userId });
      throw error;
    }
  }

  /**
   * Get login attempts for a user
   */
  async getUserLoginAttempts(email: string, page: number = 1, limit: number = 10): Promise<{ attempts: any[]; total: number }> {
    try {
      const skip = (page - 1) * limit;

      const [attempts, total] = await Promise.all([
        this.prisma.loginAttempt.findMany({
          where: { email },
          skip,
          take: limit,
          orderBy: { timestamp: 'desc' },
        }),
        this.prisma.loginAttempt.count({
          where: { email },
        }),
      ]);

      return {
        attempts: attempts.map(attempt => ({
          id: attempt.id,
          email: attempt.email,
          ipAddress: attempt.ipAddress,
          userAgent: attempt.userAgent,
          success: attempt.success,
          failureReason: attempt.failureReason,
          timestamp: attempt.timestamp,
        })),
        total,
      };
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to get login attempts', error as Error, { email });
      throw error;
    }
  }

  /**
   * Check if user is locked out
   */
  async isUserLockedOut(email: string, ipAddress: string): Promise<boolean> {
    try {
      const lockoutDuration = 15 * 60 * 1000; // 15 minutes
      const maxAttempts = 5;
      const lockoutTime = new Date(Date.now() - lockoutDuration);

      // Check recent failed attempts
      const recentFailedAttempts = await this.prisma.loginAttempt.count({
        where: {
          OR: [
            { email, success: false, timestamp: { gte: lockoutTime } },
            { ipAddress, success: false, timestamp: { gte: lockoutTime } },
          ],
        },
      });

      return recentFailedAttempts >= maxAttempts;
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to check user lockout status', error as Error, { email, ipAddress });
      return false;
    }
  }

  /**
   * Map Prisma security event to DTO
   */
  private mapSecurityEventToDto(event: any): SecurityEvent {
    return {
      id: event.id,
      userId: event.userId,
      type: event.type,
      severity: event.severity,
      description: event.description,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      metadata: event.metadata,
      timestamp: event.timestamp,
    };
  }
}
