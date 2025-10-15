import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoggerUtil } from '@ai-aggregator/shared';
import { randomBytes } from 'crypto';

export interface CreateReferralCodeDto {
  companyId: string;
  description?: string;
  maxUses?: number;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export class ReferralCodeResponse {
  id: string;
  code: string;
  companyId: string;
  isActive: boolean;
  maxUses?: number;
  usedCount: number;
  expiresAt?: Date;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  referralLink: string;
}

export class ReferralStatsResponse {
  totalCodes: number;
  activeCodes: number;
  totalUses: number;
  totalReferrals: number;
  codes: ReferralCodeResponse[];
}

@Injectable()
export class ReferralService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate unique referral code
   */
  private generateReferralCode(): string {
    return randomBytes(8).toString('hex').toUpperCase();
  }

  /**
   * Generate referral link from code
   */
  private generateReferralLink(code: string): string {
    // Use the API Gateway URL for registration
    const baseUrl = process.env.API_GATEWAY_URL || 'http://localhost:3000';
    return `${baseUrl}/v1/auth/register?ref=${code}`;
  }

  /**
   * Create a new referral code for a company
   */
  async createReferralCode(
    companyId: string,
    createDto: CreateReferralCodeDto
  ): Promise<ReferralCodeResponse> {
    try {
      // Check if company exists
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      // Generate unique code
      let code: string;
      let attempts = 0;
      const maxAttempts = 10;

      do {
        code = this.generateReferralCode();
        attempts++;
        
        if (attempts > maxAttempts) {
          throw new ConflictException('Failed to generate unique referral code');
        }

        const existingCode = await this.prisma.referralCode.findUnique({
          where: { code },
        });
      } while (await this.prisma.referralCode.findUnique({ where: { code } }));

      // Create referral code
      const referralCode = await this.prisma.referralCode.create({
        data: {
          code,
          companyId,
          description: createDto.description,
          maxUses: createDto.maxUses,
          expiresAt: createDto.expiresAt,
          metadata: createDto.metadata,
        },
      });

      LoggerUtil.info('auth-service', 'Referral code created', {
        companyId,
        codeId: referralCode.id,
        code: referralCode.code,
      });

      try {
        const referralLink = this.generateReferralLink(referralCode.code);
        LoggerUtil.info('auth-service', 'Generated referral link', { referralLink });
        
        const response = {
          ...referralCode,
          metadata: referralCode.metadata as Record<string, any> || {},
          referralLink: referralLink,
        };
        
        LoggerUtil.info('auth-service', 'Returning response', { response });
        return response;
      } catch (error) {
        LoggerUtil.error('auth-service', 'Error generating response', error as Error);
        throw error;
      }
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to create referral code', error as Error, {
        companyId,
        createDto,
      });
      throw error;
    }
  }

  /**
   * Get referral codes for a company
   */
  async getReferralCodes(companyId: string): Promise<ReferralCodeResponse[]> {
    try {
      const codes = await this.prisma.referralCode.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
      });

      return codes.map(code => ({
        ...code,
        metadata: code.metadata as Record<string, any> || {},
        referralLink: this.generateReferralLink(code.code),
      }));
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to get referral codes', error as Error, {
        companyId,
      });
      throw error;
    }
  }

  /**
   * Get referral statistics for a company
   */
  async getReferralStats(companyId: string): Promise<ReferralStatsResponse> {
    try {
      const codes = await this.prisma.referralCode.findMany({
        where: { companyId },
        include: {
          usedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const totalCodes = codes.length;
      const activeCodes = codes.filter(code => code.isActive && (!code.expiresAt || code.expiresAt > new Date())).length;
      const totalUses = codes.reduce((sum, code) => sum + code.usedCount, 0);
      const totalReferrals = codes.reduce((sum, code) => sum + code.usedBy.length, 0);

      return {
        totalCodes,
        activeCodes,
        totalUses,
        totalReferrals,
        codes: codes.map(code => ({
          ...code,
          metadata: code.metadata as Record<string, any> || {},
          referralLink: this.generateReferralLink(code.code),
        })),
      };
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to get referral stats', error as Error, {
        companyId,
      });
      throw error;
    }
  }

  /**
   * Validate and use referral code during registration
   */
  async useReferralCode(code: string, registeringCompanyId: string): Promise<{ 
    isValid: boolean; 
    referrerCompanyId?: string; 
    referralCodeId?: string;
    message?: string;
  }> {
    try {
      const referralCode = await this.prisma.referralCode.findUnique({
        where: { code },
        include: { owner: true },
      });

      if (!referralCode) {
        return { isValid: false, message: 'Invalid referral code' };
      }

      if (!referralCode.isActive) {
        return { isValid: false, message: 'Referral code is not active' };
      }

      if (referralCode.expiresAt && referralCode.expiresAt < new Date()) {
        return { isValid: false, message: 'Referral code has expired' };
      }

      // Check maxUses only if it's set (null means unlimited)
      if (referralCode.maxUses !== null && referralCode.maxUses !== undefined && referralCode.usedCount >= referralCode.maxUses) {
        return { isValid: false, message: 'Referral code has reached maximum uses' };
      }

      if (referralCode.companyId === registeringCompanyId) {
        return { isValid: false, message: 'Cannot use your own referral code' };
      }

      // Update used count
      await this.prisma.referralCode.update({
        where: { id: referralCode.id },
        data: { usedCount: referralCode.usedCount + 1 },
      });

      LoggerUtil.info('auth-service', 'Referral code used', {
        code,
        referrerCompanyId: referralCode.companyId,
        registeringCompanyId,
      });

      return {
        isValid: true,
        referrerCompanyId: referralCode.companyId,
        referralCodeId: referralCode.id,
      };
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to use referral code', error as Error, {
        code,
        registeringCompanyId,
      });
      throw error;
    }
  }


  /**
   * Deactivate referral code
   */
  async deactivateReferralCode(companyId: string, codeId: string): Promise<void> {
    try {
      const referralCode = await this.prisma.referralCode.findFirst({
        where: { id: codeId, companyId },
      });

      if (!referralCode) {
        throw new NotFoundException('Referral code not found');
      }

      await this.prisma.referralCode.update({
        where: { id: codeId },
        data: { isActive: false },
      });

      LoggerUtil.info('auth-service', 'Referral code deactivated', {
        companyId,
        codeId,
      });
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to deactivate referral code', error as Error, {
        companyId,
        codeId,
      });
      throw error;
    }
  }
}
