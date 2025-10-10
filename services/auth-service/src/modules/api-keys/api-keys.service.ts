import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoggerUtil } from '@ai-aggregator/shared';
import { CreateApiKeyDto, UpdateApiKeyDto, ApiKeyResponseDto } from './dto/api-keys.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  async getApiKeys(companyId: string): Promise<ApiKeyResponseDto[]> {
    try {
      const apiKeys = await this.prisma.apiKey.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' }
      });

      LoggerUtil.info('auth-service', 'API keys retrieved', { 
        companyId, 
        count: apiKeys.length 
      });

      return apiKeys.map(key => this.mapToResponseDto(key));
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to get API keys', error as Error, { companyId });
      throw error;
    }
  }

  async getApiKey(id: string, companyId: string): Promise<ApiKeyResponseDto> {
    try {
      const apiKey = await this.prisma.apiKey.findFirst({
        where: { 
          id,
          companyId 
        }
      });

      if (!apiKey) {
        throw new NotFoundException('API key not found');
      }

      LoggerUtil.info('auth-service', 'API key retrieved', { 
        apiKeyId: id, 
        companyId 
      });

      return this.mapToResponseDto(apiKey);
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to get API key', error as Error, { 
        apiKeyId: id, 
        companyId 
      });
      throw error;
    }
  }

  async createApiKey(createApiKeyDto: CreateApiKeyDto, companyId: string): Promise<ApiKeyResponseDto> {
    try {
      // Generate API key
      const keyValue = this.generateApiKey();
      
      // Parse expiration date if provided
      let expiresAt: Date | undefined;
      if (createApiKeyDto.expiresAt) {
        expiresAt = new Date(createApiKeyDto.expiresAt);
        if (expiresAt <= new Date()) {
          throw new BadRequestException('Expiration date must be in the future');
        }
      }

      const apiKey = await this.prisma.apiKey.create({
        data: {
          key: keyValue,
          companyId,
          name: createApiKeyDto.name,
          description: createApiKeyDto.description,
          permissions: createApiKeyDto.permissions || ['read'],
          expiresAt,
          metadata: createApiKeyDto.metadata || {}
        }
      });

      LoggerUtil.info('auth-service', 'API key created', { 
        apiKeyId: apiKey.id, 
        companyId,
        name: apiKey.name
      });

      return {
        ...this.mapToResponseDto(apiKey),
        key: keyValue // Include the key only on creation
      };
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to create API key', error as Error, { 
        companyId,
        name: createApiKeyDto.name
      });
      throw error;
    }
  }

  async updateApiKey(id: string, updateApiKeyDto: UpdateApiKeyDto, companyId: string): Promise<ApiKeyResponseDto> {
    try {
      // Check if API key exists and belongs to company
      const existingApiKey = await this.prisma.apiKey.findFirst({
        where: { 
          id,
          companyId 
        }
      });

      if (!existingApiKey) {
        throw new NotFoundException('API key not found');
      }

      // Parse expiration date if provided
      let expiresAt: Date | undefined;
      if (updateApiKeyDto.expiresAt) {
        expiresAt = new Date(updateApiKeyDto.expiresAt);
        if (expiresAt <= new Date()) {
          throw new BadRequestException('Expiration date must be in the future');
        }
      }

      const apiKey = await this.prisma.apiKey.update({
        where: { id },
        data: {
          name: updateApiKeyDto.name,
          description: updateApiKeyDto.description,
          permissions: updateApiKeyDto.permissions,
          expiresAt,
          isActive: updateApiKeyDto.isActive,
          metadata: updateApiKeyDto.metadata
        }
      });

      LoggerUtil.info('auth-service', 'API key updated', { 
        apiKeyId: id, 
        companyId 
      });

      return this.mapToResponseDto(apiKey);
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to update API key', error as Error, { 
        apiKeyId: id, 
        companyId 
      });
      throw error;
    }
  }

  async deleteApiKey(id: string, companyId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Check if API key exists and belongs to company
      const existingApiKey = await this.prisma.apiKey.findFirst({
        where: { 
          id,
          companyId 
        }
      });

      if (!existingApiKey) {
        throw new NotFoundException('API key not found');
      }

      await this.prisma.apiKey.delete({
        where: { id }
      });

      LoggerUtil.info('auth-service', 'API key deleted', { 
        apiKeyId: id, 
        companyId 
      });

      return {
        success: true,
        message: 'API key deleted successfully'
      };
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to delete API key', error as Error, { 
        apiKeyId: id, 
        companyId 
      });
      throw error;
    }
  }

  async regenerateApiKey(id: string, companyId: string): Promise<ApiKeyResponseDto> {
    try {
      // Check if API key exists and belongs to company
      const existingApiKey = await this.prisma.apiKey.findFirst({
        where: { 
          id,
          companyId 
        }
      });

      if (!existingApiKey) {
        throw new NotFoundException('API key not found');
      }

      // Generate new API key
      const newKeyValue = this.generateApiKey();

      const apiKey = await this.prisma.apiKey.update({
        where: { id },
        data: {
          key: newKeyValue,
          lastUsedAt: null // Reset last used date
        }
      });

      LoggerUtil.info('auth-service', 'API key regenerated', { 
        apiKeyId: id, 
        companyId 
      });

      return {
        ...this.mapToResponseDto(apiKey),
        key: newKeyValue // Include the new key
      };
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to regenerate API key', error as Error, { 
        apiKeyId: id, 
        companyId 
      });
      throw error;
    }
  }

  async toggleApiKey(id: string, companyId: string): Promise<ApiKeyResponseDto> {
    try {
      // Check if API key exists and belongs to company
      const existingApiKey = await this.prisma.apiKey.findFirst({
        where: { 
          id,
          companyId 
        }
      });

      if (!existingApiKey) {
        throw new NotFoundException('API key not found');
      }

      const apiKey = await this.prisma.apiKey.update({
        where: { id },
        data: {
          isActive: !existingApiKey.isActive
        }
      });

      LoggerUtil.info('auth-service', 'API key status toggled', { 
        apiKeyId: id, 
        companyId,
        newStatus: apiKey.isActive
      });

      return this.mapToResponseDto(apiKey);
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to toggle API key', error as Error, { 
        apiKeyId: id, 
        companyId 
      });
      throw error;
    }
  }

  async validateApiKey(key: string): Promise<{ valid: boolean; companyId?: string; permissions?: string[] }> {
    try {
      const apiKey = await this.prisma.apiKey.findUnique({
        where: { key },
        include: { company: true }
      });

      if (!apiKey) {
        return { valid: false };
      }

      // Check if API key is active
      if (!apiKey.isActive) {
        return { valid: false };
      }

      // Check if API key is expired
      if (apiKey.expiresAt && apiKey.expiresAt <= new Date()) {
        return { valid: false };
      }

      // Check if company is active
      if (!apiKey.company.isActive) {
        return { valid: false };
      }

      // Update last used date
      await this.prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() }
      });

      LoggerUtil.info('auth-service', 'API key validated', { 
        apiKeyId: apiKey.id, 
        companyId: apiKey.companyId 
      });

      return {
        valid: true,
        companyId: apiKey.companyId,
        permissions: apiKey.permissions as string[]
      };
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to validate API key', error as Error, { key });
      return { valid: false };
    }
  }

  private generateApiKey(): string {
    // Generate a secure API key with prefix
    const prefix = 'ak_';
    const randomPart = randomBytes(32).toString('hex');
    return `${prefix}${randomPart}`;
  }

  private mapToResponseDto(apiKey: any): ApiKeyResponseDto {
    return {
      id: apiKey.id,
      name: apiKey.name,
      description: apiKey.description,
      isActive: apiKey.isActive,
      permissions: apiKey.permissions as string[],
      lastUsedAt: apiKey.lastUsedAt,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
      metadata: apiKey.metadata
    };
  }
}
