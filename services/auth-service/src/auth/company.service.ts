import { Injectable, Logger, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { LoggerUtil } from '@ai-aggregator/shared';
import { CryptoUtil } from '../utils/crypto.util';

export interface CreateCompanyRequest {
  name: string;
  email: string;
  password: string;
  description?: string;
  website?: string;
  phone?: string;
  address?: any;
}

export interface CreateUserRequest {
  companyId: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  department?: string;
  permissions?: string[];
}

export interface CompanyResponse {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  isVerified: boolean;
  description?: string;
  website?: string;
  phone?: string;
  address?: any;
  settings?: any;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  usersCount?: number;
}

export interface UserResponse {
  id: string;
  companyId: string;
  email: string;
  isActive: boolean;
  isVerified: boolean;
  firstName?: string;
  lastName?: string;
  position?: string;
  department?: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

/**
 * Company Service
 * 
 * Управление компаниями и их пользователями:
 * - Регистрация компаний
 * - Создание пользователей в компании
 * - Управление правами доступа
 * - Аутентификация для всех ролей
 */
@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Создать новую компанию
   */
  async createCompany(data: CreateCompanyRequest): Promise<CompanyResponse> {
    try {
      LoggerUtil.info('auth-service', 'Creating new company', {
        name: data.name,
        email: data.email
      });

      // Проверяем, что email не занят
      const existingCompany = await this.prisma.company.findUnique({
        where: { email: data.email }
      });

      if (existingCompany) {
        throw new ConflictException('Company with this email already exists');
      }

      // Хешируем пароль
      const passwordHash = await CryptoUtil.hashPassword(data.password);

      // Создаем компанию
      const company = await this.prisma.company.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash,
          description: data.description,
          website: data.website,
          phone: data.phone,
          address: data.address,
          role: 'company'
        }
      });

      LoggerUtil.info('auth-service', 'Company created successfully', {
        companyId: company.id,
        name: company.name,
        email: company.email
      });

      return this.transformCompany(company);
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to create company', error as Error, {
        name: data.name,
        email: data.email
      });
      throw error;
    }
  }

  /**
   * Создать пользователя в компании
   */
  async createUser(data: CreateUserRequest): Promise<UserResponse> {
    try {
      LoggerUtil.info('auth-service', 'Creating new user in company', {
        companyId: data.companyId,
        email: data.email
      });

      // Проверяем, что компания существует
      const company = await this.prisma.company.findUnique({
        where: { id: data.companyId }
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      // Проверяем, что email не занят
      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.email }
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Хешируем пароль
      const passwordHash = await CryptoUtil.hashPassword(data.password);

      // Создаем пользователя
      const user = await this.prisma.user.create({
        data: {
          companyId: data.companyId,
          email: data.email,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          position: data.position,
          department: data.department,
          permissions: data.permissions || [],
          role: 'user'
        }
      });

      LoggerUtil.info('auth-service', 'User created successfully', {
        userId: user.id,
        companyId: data.companyId,
        email: user.email
      });

      return this.transformUser(user);
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to create user', error as Error, {
        companyId: data.companyId,
        email: data.email
      });
      throw error;
    }
  }

  /**
   * Аутентификация (для всех ролей)
   */
  async authenticate(email: string, password: string): Promise<{
    id: string;
    email: string;
    role: string;
    ownerType: 'user' | 'company';
    companyId?: string;
    permissions?: string[];
  }> {
    try {
      LoggerUtil.info('auth-service', 'Authenticating user/company', {
        email
      });

      // Сначала ищем пользователя
      let user = await this.prisma.user.findUnique({
        where: { email },
        include: { company: true }
      });

      if (user) {
        // Проверяем пароль пользователя
        const isPasswordValid = await CryptoUtil.comparePassword(password, user.passwordHash);
        if (!isPasswordValid) {
          throw new BadRequestException('Invalid credentials');
        }

        // Обновляем время последнего входа
        await this.prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });

        LoggerUtil.info('auth-service', 'User authenticated successfully', {
          userId: user.id,
          email: user.email,
          companyId: user.companyId
        });

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          ownerType: 'user',
          companyId: user.companyId,
          permissions: user.permissions as string[]
        };
      }

      // Если пользователь не найден, ищем компанию
      const company = await this.prisma.company.findUnique({
        where: { email }
      });

      if (company) {
        // Проверяем пароль компании
        const isPasswordValid = await CryptoUtil.comparePassword(password, company.passwordHash);
        if (!isPasswordValid) {
          throw new BadRequestException('Invalid credentials');
        }

        // Обновляем время последнего входа
        await this.prisma.company.update({
          where: { id: company.id },
          data: { lastLoginAt: new Date() }
        });

        LoggerUtil.info('auth-service', 'Company authenticated successfully', {
          companyId: company.id,
          email: company.email
        });

        return {
          id: company.id,
          email: company.email,
          role: company.role,
          ownerType: 'company'
        };
      }

      throw new BadRequestException('Invalid credentials');
    } catch (error) {
      LoggerUtil.error('auth-service', 'Authentication failed', error as Error, {
        email
      });
      throw error;
    }
  }

  /**
   * Получить компанию по ID
   */
  async getCompanyById(id: string): Promise<CompanyResponse> {
    try {
      const company = await this.prisma.company.findUnique({
        where: { id },
        include: {
          users: {
            select: { id: true }
          }
        }
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      return {
        ...this.transformCompany(company),
        usersCount: company.users.length
      };
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to get company', error as Error, {
        companyId: id
      });
      throw error;
    }
  }

  /**
   * Получить пользователя по ID
   */
  async getUserById(id: string): Promise<UserResponse> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: { company: true }
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return this.transformUser(user);
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to get user', error as Error, {
        userId: id
      });
      throw error;
    }
  }

  /**
   * Получить всех пользователей компании
   */
  async getCompanyUsers(companyId: string): Promise<UserResponse[]> {
    try {
      const users = await this.prisma.user.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' }
      });

      return users.map(user => this.transformUser(user));
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to get company users', error as Error, {
        companyId
      });
      throw error;
    }
  }

  /**
   * Обновить пользователя
   */
  async updateUser(id: string, updates: Partial<{
    firstName?: string;
    lastName?: string;
    position?: string;
    department?: string;
    permissions?: string[];
    isActive?: boolean;
  }>): Promise<UserResponse> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: updates
      });

      LoggerUtil.info('auth-service', 'User updated successfully', {
        userId: id,
        updates
      });

      return this.transformUser(user);
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to update user', error as Error, {
        userId: id,
        updates
      });
      throw error;
    }
  }

  /**
   * Удалить пользователя
   */
  async deleteUser(id: string): Promise<boolean> {
    try {
      await this.prisma.user.delete({
        where: { id }
      });

      LoggerUtil.info('auth-service', 'User deleted successfully', {
        userId: id
      });

      return true;
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to delete user', error as Error, {
        userId: id
      });
      throw error;
    }
  }

  /**
   * Получить все компании (для админа/ФСБ)
   */
  async getAllCompanies(): Promise<CompanyResponse[]> {
    try {
      const companies = await this.prisma.company.findMany({
        include: {
          users: {
            select: { id: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return companies.map(company => ({
        ...this.transformCompany(company),
        usersCount: company.users.length
      }));
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to get all companies', error as Error);
      throw error;
    }
  }

  /**
   * Получить всех пользователей (для админа/ФСБ)
   */
  async getAllUsers(): Promise<UserResponse[]> {
    try {
      const users = await this.prisma.user.findMany({
        include: { company: true },
        orderBy: { createdAt: 'desc' }
      });

      return users.map(user => this.transformUser(user));
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to get all users', error as Error);
      throw error;
    }
  }

  /**
   * Трансформировать компанию в ответ
   */
  private transformCompany(company: any): CompanyResponse {
    return {
      id: company.id,
      name: company.name,
      email: company.email,
      isActive: company.isActive,
      isVerified: company.isVerified,
      description: company.description,
      website: company.website,
      phone: company.phone,
      address: company.address,
      settings: company.settings,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      lastLoginAt: company.lastLoginAt
    };
  }

  /**
   * Трансформировать пользователя в ответ
   */
  private transformUser(user: any): UserResponse {
    return {
      id: user.id,
      companyId: user.companyId,
      email: user.email,
      isActive: user.isActive,
      isVerified: user.isVerified,
      firstName: user.firstName,
      lastName: user.lastName,
      position: user.position,
      department: user.department,
      permissions: user.permissions as string[],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt
    };
  }
}
