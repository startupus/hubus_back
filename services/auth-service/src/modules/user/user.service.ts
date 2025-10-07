import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoggerUtil, User, UserRole } from '@ai-aggregator/shared';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return this.mapUserToDto(user);
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to get user by ID', error as Error, { userId });
      throw error;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return this.mapUserToDto(user);
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to get user by email', error as Error, { email });
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, updateData: Partial<User>): Promise<User> {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
        firstName: (updateData as any).firstName,
        lastName: (updateData as any).lastName,
        metadata: updateData.metadata as any,
        },
      });

      LoggerUtil.info('auth-service', 'User updated', { userId });

      return this.mapUserToDto(user);
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to update user', error as Error, { userId });
      throw error;
    }
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(userId: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
      });

      // Revoke all API keys
      await this.prisma.apiKey.updateMany({
        where: { ownerId: userId, ownerType: 'user' },
        data: { isActive: false },
      });

      // Revoke all refresh tokens
      await this.prisma.refreshToken.updateMany({
        where: { userId: userId },
        data: { isRevoked: true },
      });

      LoggerUtil.info('auth-service', 'User deactivated', { userId });
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to deactivate user', error as Error, { userId });
      throw error;
    }
  }

  /**
   * Delete user account
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id: userId },
      });

      LoggerUtil.info('auth-service', 'User deleted', { userId });
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to delete user', error as Error, { userId });
      throw error;
    }
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
      role: user.role as UserRole,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
      metadata: user.metadata,
    };
  }
}
