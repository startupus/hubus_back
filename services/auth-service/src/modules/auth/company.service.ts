import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoggerUtil } from '@ai-aggregator/shared';

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

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

      // Create company
      const company = await this.prisma.company.create({
        data: {
          name: companyData.name,
          email: companyData.email,
          passwordHash: companyData.password, // Should be hashed
          description: companyData.description,
          isActive: true,
        },
      });

      LoggerUtil.info('auth-service', 'Company registered successfully', { 
        companyId: company.id, 
        email: company.email 
      });

      return company;
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to register company', error as Error);
      throw error;
    }
  }

  /**
   * Create a user within a company
   */
  async createUser(companyId: string, userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    position?: string;
    department?: string;
  }) {
    try {
      // Check if company exists
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Create user
      const user = await this.prisma.user.create({
        data: {
          email: userData.email,
          passwordHash: userData.password, // Should be hashed
          firstName: userData.firstName,
          lastName: userData.lastName,
          position: userData.position,
          department: userData.department,
          companyId: companyId,
          isVerified: true,
        },
      });

      LoggerUtil.info('auth-service', 'User created successfully', { 
        userId: user.id, 
        companyId,
        email: user.email 
      });

      return user;
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to create user', error as Error);
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
          users: true,
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
   * Get company users
   */
  async getCompanyUsers(companyId: string) {
    try {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      const users = await this.prisma.user.findMany({
        where: { companyId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          position: true,
          department: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
        },
      });

      return users;
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to get company users', error as Error);
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
          users: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              isActive: true,
            },
          },
        },
      });

      return companies;
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to get all companies', error as Error);
      throw error;
    }
  }

  /**
   * Get all users (for admin)
   */
  async getAllUsers() {
    try {
      const users = await this.prisma.user.findMany({
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return users;
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to get all users', error as Error);
      throw error;
    }
  }
}
