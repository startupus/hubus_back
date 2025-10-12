import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeyService } from '../../api-key/api-key.service';
import { LoggerUtil } from '@ai-aggregator/shared';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(
    private readonly apiKeyService: ApiKeyService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = this.extractApiKeyFromRequest(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    try {
      const validation = await this.apiKeyService.validateApiKey(apiKey);
      
      if (!validation.isValid) {
        throw new UnauthorizedException('Invalid or expired API key');
      }

      // Add company info to request
      request.user = {
        companyId: validation.companyId,
        permissions: validation.permissions,
        authType: 'api_key'
      };

      LoggerUtil.info('auth-service', 'API key authentication successful', {
        companyId: validation.companyId,
        permissions: validation.permissions
      });

      return true;
    } catch (error) {
      LoggerUtil.error('auth-service', 'API key authentication failed', error as Error, {
        apiKey: apiKey.substring(0, 10) + '...' // Log only first 10 chars for security
      });
      
      throw new UnauthorizedException('Invalid API key');
    }
  }

  private extractApiKeyFromRequest(request: any): string | null {
    // Check Authorization header: "Bearer ak_..."
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (token.startsWith('ak_')) {
        return token;
      }
    }

    // Check X-API-Key header
    const apiKeyHeader = request.headers['x-api-key'];
    if (apiKeyHeader && apiKeyHeader.startsWith('ak_')) {
      return apiKeyHeader;
    }

    // Check query parameter
    const apiKeyQuery = request.query.api_key;
    if (apiKeyQuery && apiKeyQuery.startsWith('ak_')) {
      return apiKeyQuery;
    }

    return null;
  }
}
