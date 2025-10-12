import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TokenCacheService } from '../../common/cache/token-cache.service';
import { LoggerUtil } from '@ai-aggregator/shared';
import * as bcrypt from 'bcrypt';
import { firstValueFrom } from 'rxjs';
import { randomBytes } from 'crypto';

@Injectable()
export class CompanyService {
  private readonly billingServiceUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly tokenCache: TokenCacheService,
  ) {
    this.billingServiceUrl = this.configService.get('BILLING_SERVICE_URL', 'http://billing-service:3004');
  }

  /**
   * Register a new company
   */
  async registerCompany(companyData: {
    name: string;
    email: string;
    password: string;
    description?: string;
    referralCode?: string;
    referralLink?: string;
  }) {
    try {
      // Check if company already exists
      const existingCompany = await this.prisma.company.findUnique({
        where: { email: companyData.email },
      });

      if (existingCompany) {
        throw new ConflictException('Company with this email already exists');
      }

      // Process referral link or code if provided
      let referrerCompanyId: string | undefined;
      let referralCodeId: string | undefined;

      if (companyData.referralLink || companyData.referralCode) {
        const referralIdentifier = companyData.referralLink || companyData.referralCode;
        LoggerUtil.info('auth-service', 'Processing referral link/code', { 
          referralIdentifier 
        });
        
        const referralResult = referralIdentifier ? await this.validateReferralLink(referralIdentifier) : null;
        if (referralResult && referralResult.isValid) {
          referrerCompanyId = referralResult.referrerCompanyId;
          referralCodeId = referralResult.referralCodeId;
          
          LoggerUtil.info('auth-service', 'Referral link/code validated successfully', { 
            referrerCompanyId,
            referralCodeId
          });
        } else {
          LoggerUtil.warn('auth-service', 'Invalid referral link/code', { 
            referralIdentifier,
            message: referralResult?.message
          });
          throw new ConflictException(referralResult?.message || 'Invalid referral link/code');
        }
      }

      // Hash password
      const passwordHash = await bcrypt.hash(companyData.password, 10);

      // Create company
      LoggerUtil.info('auth-service', 'Creating company with referral data', { 
        email: companyData.email,
        referrerCompanyId,
        referralCodeId
      });
      
      const company = await this.prisma.company.create({
        data: {
          name: companyData.name,
          email: companyData.email,
          passwordHash,
          description: companyData.description,
          isActive: true,
          isVerified: true, // Auto-verify companies
          role: 'company',
          referredBy: referrerCompanyId,
          referralCodeId: referralCodeId,
        },
      });
      
      LoggerUtil.info('auth-service', 'Company created successfully', { 
        companyId: company.id,
        referredBy: company.referredBy,
        referralCodeId: company.referralCodeId
      });

      // Generate JWT tokens
      const accessTokenPayload = {
        sub: company.id,
        email: company.email,
        role: company.role,
        type: 'company',
      };

      const refreshTokenPayload = {
        sub: company.id,
        email: company.email,
        type: 'refresh',
      };

      const accessToken = this.jwtService.sign(accessTokenPayload);
      const refreshToken = this.jwtService.sign(refreshTokenPayload, { expiresIn: '7d' });

      // Cache tokens for faster validation
      await Promise.all([
        this.tokenCache.cacheAccessToken(accessToken, accessTokenPayload),
        this.tokenCache.cacheRefreshToken(refreshToken, refreshTokenPayload)
      ]);

      LoggerUtil.info('auth-service', 'Company registered successfully', { 
        companyId: company.id, 
        email: company.email 
      });

      // Sync company to billing-service
      try {
        await firstValueFrom(
          this.httpService.post(`${this.billingServiceUrl}/sync/company`, {
            id: company.id,
            name: company.name,
            email: company.email,
            parentCompanyId: company.parentCompanyId,
            billingMode: company.billingMode,
            position: company.position,
            department: company.department,
          referredBy: company.referredBy,
          referralCodeId: company.referralCodeId,
          })
        );
        LoggerUtil.info('auth-service', 'Company synced to billing-service', { 
          companyId: company.id,
          referredBy: company.referredBy,
          referralCodeId: company.referralCodeId
        });
      } catch (syncError) {
        LoggerUtil.warn('auth-service', 'Failed to sync company to billing-service', { 
          companyId: company.id, 
          error: syncError instanceof Error ? syncError.message : 'Unknown error'
        });
        // Don't fail registration if sync fails
      }

      return {
        company: {
          id: company.id,
          name: company.name,
          email: company.email,
          role: company.role,
          isActive: company.isActive,
          isVerified: company.isVerified,
          createdAt: company.createdAt,
          // referredBy: company.referredBy, // TODO: Fix Prisma client generation
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to register company', error as Error);
      throw error;
    }
  }

  /**
   * Login company
   */
  async loginCompany(credentials: {
    email: string;
    password: string;
  }, ipAddress?: string, userAgent?: string) {
    try {
      // Find company
      const company = await this.prisma.company.findUnique({
        where: { email: credentials.email },
      });

      if (!company) {
        // Log failed attempt
        await this.prisma.loginAttempt.create({
          data: {
            email: credentials.email,
            ipAddress: ipAddress || 'unknown',
            userAgent: userAgent || 'unknown',
            success: false,
            failureReason: 'Company not found',
          },
        });
        throw new UnauthorizedException('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(credentials.password, company.passwordHash);

      if (!isPasswordValid) {
        // Log failed attempt
        await this.prisma.loginAttempt.create({
          data: {
            email: credentials.email,
            ipAddress: ipAddress || 'unknown',
            userAgent: userAgent || 'unknown',
            success: false,
            failureReason: 'Invalid password',
          },
        });
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if company is active
      if (!company.isActive) {
        throw new UnauthorizedException('Company account is disabled');
      }

      // Update last login
      await this.prisma.company.update({
        where: { id: company.id },
        data: { lastLoginAt: new Date() },
      });

      // Log successful attempt
      await this.prisma.loginAttempt.create({
        data: {
          email: credentials.email,
          ipAddress: ipAddress || 'unknown',
          userAgent: userAgent || 'unknown',
          success: true,
        },
      });

      // Generate JWT tokens
      const accessTokenPayload = {
        sub: company.id,
        email: company.email,
        role: company.role,
        type: 'company',
      };

      const refreshTokenPayload = {
        sub: company.id,
        email: company.email,
        type: 'refresh',
      };

      const accessToken = this.jwtService.sign(accessTokenPayload);
      const refreshToken = this.jwtService.sign(refreshTokenPayload, { expiresIn: '7d' });

      // Cache tokens for faster validation
      await Promise.all([
        this.tokenCache.cacheAccessToken(accessToken, accessTokenPayload),
        this.tokenCache.cacheRefreshToken(refreshToken, refreshTokenPayload)
      ]);

      LoggerUtil.info('auth-service', 'Company logged in successfully', { 
        companyId: company.id, 
        email: company.email 
      });

      return {
        company: {
          id: company.id,
          name: company.name,
          email: company.email,
          role: company.role,
          isActive: company.isActive,
          isVerified: company.isVerified,
          lastLoginAt: company.lastLoginAt,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to login company', error as Error);
      throw error;
    }
  }


  /**
   * Get company by ID
   */
  async getCompany(companyId: string) {
    try {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        include: {
          childCompanies: true,
        },
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      return company;
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to get company', error as Error);
      throw error;
    }
  }





  /**
   * Get all companies (for admin)
   */
  async getAllCompanies() {
    try {
      const companies = await this.prisma.company.findMany({
        include: {
          parentCompany: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return companies;
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to get all users', error as Error);
      throw error;
    }
  }


  /**
   * Create company API key
   */
  async createCompanyApiKey(companyId: string, apiKeyData: any) {
    try {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      // Use ApiKeyService to create the API key
      const apiKeyService = new (await import('../api-key/api-key.service')).ApiKeyService(this.prisma);
      return await apiKeyService.createApiKey(companyId, apiKeyData);
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to create company API key', error as Error, { companyId });
      throw error;
    }
  }

  /**
   * Get company API keys
   */
  async getCompanyApiKeys(companyId: string) {
    try {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      const apiKeys = await this.prisma.apiKey.findMany({
        where: { 
          companyId: companyId,
        },
        select: {
          id: true,
          key: true,
          name: true,
          description: true,
          isActive: true,
          permissions: true,
          lastUsedAt: true,
          expiresAt: true,
          createdAt: true,
        },
      });

      return apiKeys;
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to get company API keys', error as Error);
      throw error;
    }
  }

  /**
   * Update billing mode
   */
  async updateBillingMode(companyId: string, billingMode: 'SELF_PAID' | 'PARENT_PAID') {
    try {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      // Если переключается на PARENT_PAID, проверяем наличие родительской компании
      if (billingMode === 'PARENT_PAID' && !company.parentCompanyId) {
        throw new ConflictException('Cannot set PARENT_PAID mode without parent company');
      }

      const updatedCompany = await this.prisma.company.update({
        where: { id: companyId },
        data: { billingMode },
      });

      LoggerUtil.info('auth-service', 'Billing mode updated', { 
        companyId, 
        billingMode 
      });

      return updatedCompany;
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to update billing mode', error as Error);
      throw error;
    }
  }

  /**
   * Generate unique referral code
   */
  private generateReferralCode(): string {
    return randomBytes(8).toString('hex').toUpperCase();
  }

  /**
   * Validate referral link or code
   */
  private async validateReferralLink(identifier: string): Promise<{ 
    isValid: boolean; 
    referrerCompanyId?: string; 
    referralCodeId?: string;
    message?: string;
  }> {
    try {
      // Extract code from referral link if it's a full URL
      let code = identifier;
      if (identifier.includes('?ref=')) {
        const url = new URL(identifier);
        code = url.searchParams.get('ref') || identifier;
      }

      const referralCode = await this.prisma.referralCode.findUnique({
        where: { code },
        include: { owner: true },
      });

      if (!referralCode) {
        return { isValid: false, message: 'Invalid referral link' };
      }

      if (!referralCode.isActive) {
        return { isValid: false, message: 'Referral link is not active' };
      }

      if (referralCode.expiresAt && referralCode.expiresAt < new Date()) {
        return { isValid: false, message: 'Referral link has expired' };
      }

      // Check maxUses only if it's set (null means unlimited)
      if (referralCode.maxUses !== null && referralCode.maxUses !== undefined && referralCode.usedCount >= referralCode.maxUses) {
        return { isValid: false, message: 'Referral link has reached maximum uses' };
      }

      // Update used count
      await this.prisma.referralCode.update({
        where: { id: referralCode.id },
        data: { usedCount: referralCode.usedCount + 1 },
      });

      return {
        isValid: true,
        referrerCompanyId: referralCode.companyId,
        referralCodeId: referralCode.id,
      };
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to validate referral link', error as Error, { identifier });
      return { isValid: false, message: 'Failed to validate referral link' };
    }
  }

  /**
   * Validate referral code (legacy method for backward compatibility)
   */
  private async validateReferralCode(code: string): Promise<{ 
    isValid: boolean; 
    referrerCompanyId?: string; 
    referralCodeId?: string;
    message?: string;
  }> {
    return this.validateReferralLink(code);
  }

  /**
   * Get company by ID (replaces getUserById)
   */
  async getCompanyById(companyId: string) {
    try {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      return this.mapCompanyToDto(company);
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to get company by ID', error as Error, { companyId });
      throw error;
    }
  }

  /**
   * Get company by email (replaces getUserByEmail)
   */
  async getCompanyByEmail(email: string) {
    try {
      const company = await this.prisma.company.findUnique({
        where: { email },
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      return this.mapCompanyToDto(company);
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to get company by email', error as Error, { email });
      throw error;
    }
  }

  /**
   * Update company profile (replaces updateUser)
   */
  async updateCompany(companyId: string, updateData: Partial<{
    name: string;
    description: string;
    website: string;
    phone: string;
    address: Record<string, unknown>;
    settings: Record<string, unknown>;
    metadata: Record<string, unknown>;
  }>) {
    try {
      const company = await this.prisma.company.update({
        where: { id: companyId },
        data: {
          name: updateData.name,
          description: updateData.description,
          website: updateData.website,
          phone: updateData.phone,
          address: updateData.address as any,
          settings: updateData.settings as any,
          metadata: updateData.metadata as any,
        },
      });

      LoggerUtil.info('auth-service', 'Company updated', { companyId });

      return this.mapCompanyToDto(company);
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to update company', error as Error, { companyId });
      throw error;
    }
  }

  /**
   * Deactivate company account (replaces deactivateUser)
   */
  async deactivateCompany(companyId: string): Promise<void> {
    try {
      await this.prisma.company.update({
        where: { id: companyId },
        data: { isActive: false },
      });

      // Revoke all API keys
      await this.prisma.apiKey.updateMany({
        where: { companyId: companyId },
        data: { isActive: false },
      });

      // Revoke all refresh tokens
      await this.prisma.refreshToken.updateMany({
        where: { companyId: companyId },
        data: { isRevoked: true },
      });

      LoggerUtil.info('auth-service', 'Company deactivated', { companyId });
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to deactivate company', error as Error, { companyId });
      throw error;
    }
  }


  /**
   * Map Prisma company to DTO (replaces mapCompanyToDto from UserService)
   */
  private mapCompanyToDto(company: any) {
    return {
      id: company.id,
      name: company.name,
      email: company.email,
      passwordHash: company.passwordHash,
      isActive: company.isActive,
      isVerified: company.isVerified,
      role: company.role,
      description: company.description,
      website: company.website,
      phone: company.phone,
      address: company.address,
      settings: company.settings,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      lastLoginAt: company.lastLoginAt,
      metadata: company.metadata,
    };
  }
}
