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
      const company = await this.prisma.company.findUnique({
        where: { id: userId },
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      return this.mapCompanyToDto(company);
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
      const company = await this.prisma.company.findUnique({
        where: { email },
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      return this.mapCompanyToDto(company);
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
      const company = await this.prisma.company.update({
        where: { id: userId },
        data: {
        name: (updateData as any).firstName ? `${(updateData as any).firstName}'s Company` : undefined,
        description: (updateData as any).lastName,
        metadata: updateData.metadata as any,
        },
      });

      LoggerUtil.info('auth-service', 'Company updated', { userId });

      return this.mapCompanyToDto(company);
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
      await this.prisma.company.update({
        where: { id: userId },
        data: { isActive: false },
      });

      // Revoke all API keys
      await this.prisma.apiKey.updateMany({
        where: { companyId: userId },
        data: { isActive: false },
      });

      // Revoke all refresh tokens
      await this.prisma.refreshToken.updateMany({
        where: { companyId: userId },
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
      await this.prisma.company.delete({
        where: { id: userId },
      });

      LoggerUtil.info('auth-service', 'User deleted', { userId });
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to delete user', error as Error, { userId });
      throw error;
    }
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
      role: company.role as UserRole,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      lastLoginAt: company.lastLoginAt,
      metadata: company.metadata,
    };
  }
}
