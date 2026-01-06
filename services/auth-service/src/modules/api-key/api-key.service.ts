import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoggerUtil, ApiKey, Permission, ValidationUtil } from '@ai-aggregator/shared';
import { CryptoUtil } from '../../common/utils/crypto.util';
import { CreateApiKeyDto, UpdateApiKeyDto } from '@ai-aggregator/shared';

@Injectable()
export class ApiKeyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new API key
   */
  async createApiKey(companyId: string, createApiKeyDto: CreateApiKeyDto): Promise<ApiKey> {
    try {
      LoggerUtil.warn('auth-service', 'ApiKeyService.createApiKey called', { 
        createApiKeyDto, 
        name: createApiKeyDto.name,
        nameType: typeof createApiKeyDto.name,
        nameLength: createApiKeyDto.name?.length,
        nameTrimmedLength: createApiKeyDto.name?.trim().length,
        nameIsEmpty: !createApiKeyDto.name,
        nameTrimIsEmpty: createApiKeyDto.name?.trim().length === 0
      });
      
      // Validate name
      if (!createApiKeyDto.name || typeof createApiKeyDto.name !== 'string' || createApiKeyDto.name.trim().length === 0) {
        LoggerUtil.error('auth-service', 'Validation failed: empty name', new Error('Empty name'), { name: createApiKeyDto.name });
        throw new BadRequestException('Name is required and cannot be empty');
      }
      if (createApiKeyDto.name.length > 100) {
        LoggerUtil.error('auth-service', 'Validation failed: name too long', new Error('Name too long'), { nameLength: createApiKeyDto.name.length });
        throw new BadRequestException('Name cannot exceed 100 characters');
      }
      LoggerUtil.warn('auth-service', 'Validation passed');
      
      // Generate API key
      const key = CryptoUtil.generateApiKey();

      // Create API key record
      const apiKey = await this.prisma.apiKey.create({
        data: {
          key,
          companyId: companyId,
          name: createApiKeyDto.name,
          description: createApiKeyDto.description,
          permissions: createApiKeyDto.permissions || [],
          expiresAt: createApiKeyDto.expiresAt ? new Date(createApiKeyDto.expiresAt) : null,
        },
      });

      // Log security event
      await this.logSecurityEvent(companyId, 'API_KEY_CREATED', 'MEDIUM', `API key created: ${createApiKeyDto.name}`);

      LoggerUtil.info('auth-service', 'API key created', { 
        apiKeyId: apiKey.id, 
        companyId, 
        name: createApiKeyDto.name 
      });

      return this.mapApiKeyToDto(apiKey);
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to create API key', error as Error, { companyId });
      throw error;
    }
  }

  /**
   * Get API keys by company ID
   */
  async getApiKeysByCompanyId(companyId: string): Promise<ApiKey[]> {
    try {
      const apiKeys = await this.prisma.apiKey.findMany({
        where: {
          companyId: companyId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return apiKeys.map(key => this.mapApiKeyToDto(key));
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to get API keys', error as Error, { companyId });
      throw error;
    }
  }

  /**
   * Get API key by ID
   */
  async getApiKeyById(apiKeyId: string, companyId: string): Promise<ApiKey> {
    try {
      const apiKey = await this.prisma.apiKey.findFirst({
        where: {
          id: apiKeyId,
          companyId: companyId,
        },
      });

      if (!apiKey) {
        throw new NotFoundException('API key not found');
      }

      return this.mapApiKeyToDto(apiKey);
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to get API key', error as Error, { apiKeyId, companyId });
      throw error;
    }
  }

  /**
   * Get API key by key value
   */
  async getApiKeyByKey(key: string): Promise<ApiKey> {
    try {
      const apiKey = await this.prisma.apiKey.findUnique({
        where: { key },
        include: { company: true },
      });

      if (!apiKey) {
        throw new NotFoundException('API key not found');
      }

      return this.mapApiKeyToDto(apiKey);
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to get API key by key', error as Error, { key });
      throw error;
    }
  }

  /**
   * List user's API keys
   */
  async listApiKeys(companyId: string, page: number = 1, limit: number = 10): Promise<{ apiKeys: ApiKey[]; total: number }> {
    try {
      const skip = (page - 1) * limit;

      const [apiKeys, total] = await Promise.all([
        this.prisma.apiKey.findMany({
          where: { companyId: companyId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.apiKey.count({
          where: { companyId: companyId },
        }),
      ]);

      return {
        apiKeys: apiKeys.map(apiKey => this.mapApiKeyToDto(apiKey)),
        total,
      };
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to list API keys', error as Error, { companyId });
      throw error;
    }
  }

  /**
   * Update API key
   */
  async updateApiKey(apiKeyId: string, companyId: string, updateApiKeyDto: UpdateApiKeyDto): Promise<ApiKey> {
    try {
      // Check if API key exists and belongs to user
      const existingApiKey = await this.prisma.apiKey.findFirst({
        where: {
          id: apiKeyId,
          companyId: companyId,
        },
      });

      if (!existingApiKey) {
        throw new NotFoundException('API key not found');
      }

      // Update API key
      const apiKey = await this.prisma.apiKey.update({
        where: { id: apiKeyId },
        data: {
          name: updateApiKeyDto.name,
          description: updateApiKeyDto.description,
          permissions: updateApiKeyDto.permissions,
          isActive: updateApiKeyDto.isActive,
        },
      });

      // Log security event
      await this.logSecurityEvent(companyId, 'API_KEY_UPDATED', 'LOW', `API key updated: ${apiKey.name}`);

      LoggerUtil.info('auth-service', 'API key updated', { 
        apiKeyId, 
        companyId, 
        name: apiKey.name 
      });

      return this.mapApiKeyToDto(apiKey);
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to update API key', error as Error, { apiKeyId, companyId });
      throw error;
    }
  }

  /**
   * Revoke API key
   */
  async revokeApiKey(apiKeyId: string, companyId: string): Promise<void> {
    try {
      // Check if API key exists and belongs to user
      const existingApiKey = await this.prisma.apiKey.findFirst({
        where: {
          id: apiKeyId,
          companyId: companyId,
        },
      });

      if (!existingApiKey) {
        throw new NotFoundException('API key not found');
      }

      // Revoke API key
      await this.prisma.apiKey.update({
        where: { id: apiKeyId },
        data: { isActive: false },
      });

      // Log security event
      await this.logSecurityEvent(companyId, 'API_KEY_REVOKED', 'MEDIUM', `API key revoked: ${existingApiKey.name}`);

      LoggerUtil.info('auth-service', 'API key revoked', { 
        apiKeyId, 
        companyId, 
        name: existingApiKey.name 
      });
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to revoke API key', error as Error, { apiKeyId, companyId });
      throw error;
    }
  }

  /**
   * Validate API key
   */
  async validateApiKey(key: string): Promise<{ isValid: boolean; companyId?: string; permissions?: Permission[] }> {
    try {
      // Проверяем формат ключа: поддерживаем новый (40 символов) и старый (64 hex) форматы
      if (!key.startsWith('ak_')) {
        LoggerUtil.debug('auth-service', 'API key must start with "ak_" prefix', { 
          keyLength: key.length,
          keyPrefix: key.substring(0, 10) + '...'
        });
        return { isValid: false };
      }
      
      // Новый формат: ak_[A-Za-z0-9]{40}
      const newFormatRegex = /^ak_[A-Za-z0-9]{40}$/;
      // Старый формат: ak_[a-f0-9]{64}
      const oldFormatRegex = /^ak_[a-f0-9]{64}$/i;
      
      if (!newFormatRegex.test(key) && !oldFormatRegex.test(key)) {
        LoggerUtil.debug('auth-service', 'Invalid API key format', { 
          keyLength: key.length,
          keyPrefix: key.substring(0, 10) + '...',
          expectedFormat: 'ak_[A-Za-z0-9]{40} or ak_[a-f0-9]{64}'
        });
        return { isValid: false };
      }

      const apiKey = await this.prisma.apiKey.findUnique({
        where: { key },
        include: { company: true },
      });

      if (!apiKey) {
        LoggerUtil.debug('auth-service', 'API key not found in database', { key: key.substring(0, 10) + '...' });
        return { isValid: false };
      }

      if (!apiKey.isActive) {
        LoggerUtil.debug('auth-service', 'API key is not active', { keyId: apiKey.id, isActive: apiKey.isActive });
        return { isValid: false };
      }

      if (!apiKey.company.isActive) {
        LoggerUtil.debug('auth-service', 'Company is not active', { companyId: apiKey.companyId, isActive: apiKey.company.isActive });
        return { isValid: false };
      }

      // Check if API key is expired
      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        LoggerUtil.debug('auth-service', 'API key is expired', { 
          keyId: apiKey.id, 
          expiresAt: apiKey.expiresAt.toISOString(),
          now: new Date().toISOString()
        });
        return { isValid: false };
      }

      // Update last used timestamp
      await this.prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      });

      LoggerUtil.debug('auth-service', 'API key validation successful', {
        keyId: apiKey.id,
        companyId: apiKey.companyId,
        permissions: apiKey.permissions
      });

      return {
        isValid: true,
        companyId: apiKey.companyId,
        permissions: apiKey.permissions as Permission[],
      };
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to validate API key', error as Error, { key: key.substring(0, 10) + '...' });
      return { isValid: false };
    }
  }

  /**
   * Map Prisma API key to DTO
   */
  private mapApiKeyToDto(apiKey: any): ApiKey {
    return {
      id: apiKey.id,
      key: apiKey.key,
      companyId: apiKey.companyId,
      name: apiKey.name,
      description: apiKey.description,
      isActive: apiKey.isActive,
      permissions: apiKey.permissions as Permission[],
      lastUsedAt: apiKey.lastUsedAt,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
      metadata: apiKey.metadata,
    };
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(
    companyId: string,
    type: string,
    severity: string,
    description: string
  ): Promise<void> {
    try {
      await this.prisma.securityEvent.create({
        data: {
          companyId: companyId,
          type: type as any,
          severity: severity as any,
          description,
        },
      });
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to log security event', error as Error);
    }
  }
}
