import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { RegisterDto, LoginDto, AuthResponseDto } from '@ai-aggregator/shared';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

@Injectable()
export class AuthService {
  private readonly authServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.authServiceUrl = this.configService.get('AUTH_SERVICE_URL', 'http://auth-service:3001');
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    try {
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.post(`${this.authServiceUrl}/auth/register`, registerDto)
      );

      // Auth-service returns AuthResult format
      const authResult = response.data;
      
      if (!authResult.success) {
        if (authResult.error?.includes('already exists')) {
          throw new HttpException('User with this email already exists', HttpStatus.CONFLICT);
        }
        throw new HttpException(authResult.error || 'Registration failed', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return {
        accessToken: authResult.token || 'temp-token',
        refreshToken: authResult.refreshToken || 'temp-refresh-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: authResult.user ? {
          id: authResult.user.id,
          email: authResult.user.email,
          role: authResult.user.role,
          isVerified: authResult.user.isVerified,
        } : undefined,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error.response?.status === 409) {
        throw new HttpException('User with this email already exists', HttpStatus.CONFLICT);
      }
      throw new HttpException('Registration failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    try {
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.post(`${this.authServiceUrl}/auth/login`, loginDto)
      );

      // Auth-service returns AuthResult format
      const authResult = response.data;
      
      if (!authResult.success) {
        if (authResult.requiresVerification) {
          throw new HttpException('Email verification required', HttpStatus.UNAUTHORIZED);
        }
        throw new HttpException(authResult.error || 'Invalid credentials', HttpStatus.UNAUTHORIZED);
      }

      return {
        accessToken: authResult.token || 'temp-token',
        refreshToken: authResult.refreshToken || 'temp-refresh-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: authResult.user ? {
          id: authResult.user.id,
          email: authResult.user.email,
          role: authResult.user.role,
          isVerified: authResult.user.isVerified,
        } : undefined,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error.response?.status === 401) {
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }
      throw new HttpException('Login failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async createApiKey(createApiKeyDto: any): Promise<any> {
    // Mock implementation for API Gateway
    return {
      success: true,
      message: 'API key created successfully',
      apiKey: {
        id: `ak-${Date.now()}`,
        name: createApiKeyDto.name || 'Default API Key',
        key: `ak_${Math.random().toString(36).substr(2, 32)}`,
        userId: createApiKeyDto.userId,
        isActive: true,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
      }
    };
  }

  async getApiKeys(getApiKeysDto: any): Promise<any> {
    // Mock implementation for API Gateway
    return {
      success: true,
      message: 'API keys retrieved successfully',
      apiKeys: [
        {
          id: 'ak-1234567890',
          name: 'Test API Key',
          key: 'ak_1234567890abcdef',
          userId: getApiKeysDto.userId,
          isActive: true,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };
  }

  async revokeApiKey(keyId: string): Promise<any> {
    // Mock implementation for API Gateway
    return {
      success: true,
      message: 'API key revoked successfully',
      apiKey: {
        id: keyId,
        isActive: false,
        revokedAt: new Date().toISOString()
      }
    };
  }
}

