import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { LoggerUtil } from '@ai-aggregator/shared';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  private readonly authServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.authServiceUrl = this.configService.get('AUTH_SERVICE_URL', 'http://auth-service:3001');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = this.extractApiKeyFromRequest(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is required. Please provide it in Authorization header as "Bearer ak_[A-Za-z0-9]{40}"');
    }

    try {
      // Валидируем API ключ через auth-service
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.authServiceUrl}/auth/api-keys/validate`,
          { key: apiKey },
          { timeout: 5000 }
        )
      );

      if (!response.data?.success) {
        throw new UnauthorizedException('Invalid or expired API key');
      }

      // Добавляем информацию о компании в request
      request.user = {
        companyId: response.data.authContext?.companyId,
        permissions: response.data.authContext?.permissions || [],
        authType: 'api_key',
        apiKeyId: apiKey,
      };

      LoggerUtil.info('api-gateway', 'API key authentication successful', {
        companyId: response.data.authContext?.companyId,
        permissions: response.data.authContext?.permissions,
      });

      return true;
    } catch (error: any) {
      LoggerUtil.error('api-gateway', 'API key authentication failed', error, {
        apiKey: apiKey.substring(0, 10) + '...', // Log only first 10 chars for security
        responseStatus: error.response?.status,
        responseData: error.response?.data,
      });

      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new UnauthorizedException('Invalid or expired API key');
      }

      if (error.response?.data?.error) {
        throw new UnauthorizedException(`API key validation failed: ${error.response.data.error}`);
      }

      throw new UnauthorizedException('Failed to validate API key');
    }
  }

  private extractApiKeyFromRequest(request: any): string | null {
    // Единый формат: только "Bearer ak_..." или "ak_..."
    // Формат ключа: ak_ + 40 символов (A-Za-z0-9) = 43 символа всего
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return null;
    }

    // Support both "Bearer <key>" and "<key>" formats
    let key: string;
    if (authHeader.startsWith('Bearer ')) {
      key = authHeader.substring(7).trim();
    } else {
      key = authHeader.trim();
    }

    // Если ключ пустой, возвращаем null
    if (!key || key.length === 0) {
      return null;
    }

    // Поддерживаем два формата для обратной совместимости:
    // 1. Новый формат: ak_ + 40 символов (A-Za-z0-9) = 43 символа
    // 2. Старый формат: ak_ + 64 hex символа = 67 символов
    if (!key.startsWith('ak_')) {
      LoggerUtil.warn('api-gateway', 'API key must start with "ak_" prefix', {
        keyLength: key.length,
        keyPrefix: key.substring(0, 10) + '...'
      });
      return null;
    }

    // Проверяем новый формат: ak_ + 40 символов (A-Za-z0-9) = 43 символа
    const newFormatRegex = /^ak_[A-Za-z0-9]{40}$/;
    // Проверяем старый формат: ak_ + 64 hex символа = 67 символов
    const oldFormatRegex = /^ak_[a-f0-9]{64}$/i;
    
    if (newFormatRegex.test(key)) {
      // Новый формат - OK
      return key;
    } else if (oldFormatRegex.test(key)) {
      // Старый формат - OK для обратной совместимости
      LoggerUtil.debug('api-gateway', 'Using legacy API key format (64 hex chars)', {
        keyLength: key.length
      });
      return key;
    } else {
      LoggerUtil.warn('api-gateway', 'Invalid API key format. Expected: ak_[A-Za-z0-9]{40} or ak_[a-f0-9]{64}', {
        keyLength: key.length,
        keyPrefix: key.substring(0, 10) + '...'
      });
      return null;
    }
  }
}

