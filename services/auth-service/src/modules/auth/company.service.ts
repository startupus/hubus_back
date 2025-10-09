import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoggerUtil } from '@ai-aggregator/shared';
import * as bcrypt from 'bcrypt';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CompanyService {
  private readonly billingServiceUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
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
  }) {
    try {
      // Check if company already exists
      const existingCompany = await this.prisma.company.findUnique({
        where: { email: companyData.email },
      });

      if (existingCompany) {
        throw new ConflictException('Company with this email already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(companyData.password, 10);

      // Create company
      const company = await this.prisma.company.create({
        data: {
          name: companyData.name,
          email: companyData.email,
          passwordHash,
          description: companyData.description,
          isActive: true,
          isVerified: true, // Auto-verify companies
          role: 'company',
        },
      });

      // Generate JWT tokens
      const accessToken = this.jwtService.sign({
        sub: company.id,
        email: company.email,
        role: company.role,
        type: 'company',
      });

      const refreshToken = this.jwtService.sign({
        sub: company.id,
        email: company.email,
        type: 'refresh',
      }, { expiresIn: '7d' });

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
          })
        );
        LoggerUtil.info('auth-service', 'Company synced to billing-service', { companyId: company.id });
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
      const accessToken = this.jwtService.sign({
        sub: company.id,
        email: company.email,
        role: company.role,
        type: 'company',
      });

      const refreshToken = this.jwtService.sign({
        sub: company.id,
        email: company.email,
        type: 'refresh',
      }, { expiresIn: '7d' });

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
   * Create a child company (employee company)
   */
  async createChildCompany(parentCompanyId: string, companyData: {
    name: string;
    email: string;
    password: string;
    billingMode?: 'SELF_PAID' | 'PARENT_PAID';
    position?: string;
    department?: string;
    description?: string;
  }) {
    try {
      // Check if parent company exists
      const parentCompany = await this.prisma.company.findUnique({
        where: { id: parentCompanyId },
      });

      if (!parentCompany) {
        throw new NotFoundException('Parent company not found');
      }

      // Check if company with this email already exists
      const existingCompany = await this.prisma.company.findUnique({
        where: { email: companyData.email },
      });

      if (existingCompany) {
        throw new ConflictException('Company with this email already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(companyData.password, 10);

      // Create child company
      const childCompany = await this.prisma.company.create({
        data: {
          name: companyData.name,
          email: companyData.email,
          passwordHash,
          description: companyData.description,
          parentCompanyId: parentCompanyId,
          billingMode: companyData.billingMode || 'PARENT_PAID',
          position: companyData.position,
          department: companyData.department,
          isActive: true,
          isVerified: true,
          role: 'company',
        },
      });

      LoggerUtil.info('auth-service', 'Child company created successfully', { 
        childCompanyId: childCompany.id, 
        parentCompanyId,
        email: childCompany.email 
      });

      return childCompany;
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to create child company', error as Error);
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
   * Update company
   */
  async updateCompany(companyId: string, updateData: {
    name?: string;
    description?: string;
    isActive?: boolean;
  }) {
    try {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      const updatedCompany = await this.prisma.company.update({
        where: { id: companyId },
        data: updateData,
      });

      LoggerUtil.info('auth-service', 'Company updated successfully', { 
        companyId: updatedCompany.id 
      });

      return updatedCompany;
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to update company', error as Error);
      throw error;
    }
  }

  /**
   * Get child companies (employees)
   */
  async getChildCompanies(parentCompanyId: string) {
    try {
      const parentCompany = await this.prisma.company.findUnique({
        where: { id: parentCompanyId },
      });

      if (!parentCompany) {
        throw new NotFoundException('Parent company not found');
      }

      const childCompanies = await this.prisma.company.findMany({
        where: { parentCompanyId },
        select: {
          id: true,
          name: true,
          email: true,
          position: true,
          department: true,
          billingMode: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
        },
      });

      return childCompanies;
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to get child companies', error as Error);
      throw error;
    }
  }

  /**
   * Get company hierarchy (tree structure)
   */
  async getCompanyHierarchy(companyId: string, depth: number = 3): Promise<any> {
    try {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      return await this.buildHierarchyTree(companyId, depth);
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to get company hierarchy', error as Error);
      throw error;
    }
  }

  private async buildHierarchyTree(companyId: string, maxDepth: number, currentDepth: number = 0): Promise<any> {
    if (currentDepth >= maxDepth) {
      return null;
    }

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        email: true,
        position: true,
        department: true,
        billingMode: true,
        isActive: true,
      },
    });

    if (!company) {
      return null;
    }

    const childCompanies = await this.prisma.company.findMany({
      where: { parentCompanyId: companyId },
      select: { id: true },
    });

    const children = await Promise.all(
      childCompanies.map((child) =>
        this.buildHierarchyTree(child.id, maxDepth, currentDepth + 1)
      )
    );

    return {
      ...company,
      childCompanies: children.filter((c) => c !== null),
    };
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
   * Create API key for company
   */
  async createCompanyApiKey(companyId: string, apiKeyData: {
    name: string;
    description?: string;
    permissions?: string[];
    expiresAt?: Date;
  }) {
    try {
      // Check if company exists
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      // Generate unique API key
      const key = `sk-comp-${Buffer.from(`${companyId}-${Date.now()}-${Math.random()}`).toString('base64').replace(/[^a-zA-Z0-9]/g, '')}`;

      // Create API key
      const apiKey = await this.prisma.apiKey.create({
        data: {
          key,
          companyId: companyId,
          name: apiKeyData.name,
          description: apiKeyData.description,
          permissions: apiKeyData.permissions || [],
          expiresAt: apiKeyData.expiresAt,
          isActive: true,
        },
      });

      LoggerUtil.info('auth-service', 'Company API key created successfully', { 
        companyId, 
        apiKeyId: apiKey.id 
      });

      return apiKey;
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to create company API key', error as Error);
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
}
