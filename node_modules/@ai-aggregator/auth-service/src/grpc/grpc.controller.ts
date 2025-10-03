import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AuthService } from '../modules/auth/auth.service';
import { ApiKeyService } from '../modules/api-key/api-key.service';
import { UserService } from '../modules/user/user.service';
import { LoggerUtil } from '@ai-aggregator/shared';

@Controller()
export class GrpcController {
  constructor(
    private readonly authService: AuthService,
    private readonly apiKeyService: ApiKeyService,
    private readonly userService: UserService,
  ) {}

  @GrpcMethod('AuthService', 'CreateUser')
  async createUser(data: any) {
    try {
      LoggerUtil.debug('auth-service', 'gRPC CreateUser called', { email: data.email });
      
      const result = await this.authService.register({
        email: data.email,
        password: data.password,
        firstName: data.first_name,
        lastName: data.last_name,
      });

      return {
        success: result.success,
        user: result.user ? {
          id: result.user.id,
          email: result.user.email,
          is_active: result.user.isActive,
          is_verified: result.user.isVerified,
          role: result.user.role,
          first_name: data.first_name,
          last_name: data.last_name,
          created_at: result.user.createdAt.toISOString(),
          updated_at: result.user.updatedAt.toISOString(),
        } : undefined,
        error: result.error,
      };
    } catch (error) {
      LoggerUtil.error('auth-service', 'gRPC CreateUser failed', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @GrpcMethod('AuthService', 'GetUser')
  async getUser(data: any) {
    try {
      LoggerUtil.debug('auth-service', 'gRPC GetUser called', { id: data.id, email: data.email });
      
      let user;
      if (data.id) {
        user = await this.userService.getUserById(data.id);
      } else if (data.email) {
        user = await this.userService.getUserByEmail(data.email);
      } else {
        return {
          success: false,
          error: 'Either id or email must be provided',
        };
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          is_active: user.isActive,
          is_verified: user.isVerified,
          role: user.role,
          first_name: user.firstName,
          last_name: user.lastName,
          created_at: user.createdAt.toISOString(),
          updated_at: user.updatedAt.toISOString(),
          last_login_at: user.lastLoginAt?.toISOString(),
        },
      };
    } catch (error) {
      LoggerUtil.error('auth-service', 'gRPC GetUser failed', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @GrpcMethod('AuthService', 'Login')
  async login(data: any) {
    try {
      LoggerUtil.debug('auth-service', 'gRPC Login called', { email: data.email });
      
      const result = await this.authService.login({
        email: data.email,
        password: data.password,
      }, data.ip_address, data.user_agent);

      return {
        success: result.success,
        access_token: result.token,
        refresh_token: result.refreshToken,
        user: result.user ? {
          id: result.user.id,
          email: result.user.email,
          is_active: result.user.isActive,
          is_verified: result.user.isVerified,
          role: result.user.role,
          first_name: (result.user as any).firstName || '',
          last_name: (result.user as any).lastName || '',
          created_at: result.user.createdAt.toISOString(),
          updated_at: result.user.updatedAt.toISOString(),
          last_login_at: result.user.lastLoginAt?.toISOString(),
        } : undefined,
        error: result.error,
        requires_verification: result.requiresVerification,
      };
    } catch (error) {
      LoggerUtil.error('auth-service', 'gRPC Login failed', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @GrpcMethod('AuthService', 'ValidateToken')
  async validateToken(data: any) {
    try {
      LoggerUtil.debug('auth-service', 'gRPC ValidateToken called', { token_type: data.token_type });
      
      if (data.token_type === 'api_key') {
        const validation = await this.apiKeyService.validateApiKey(data.token);
        return {
          success: validation.isValid,
          auth_context: validation.isValid ? {
            user_id: validation.userId,
            email: '', // Will be filled by the caller
            role: '', // Will be filled by the caller
            permissions: validation.permissions || [],
            api_key_id: data.token,
          } : undefined,
          error: validation.isValid ? undefined : 'Invalid API key',
        };
      } else {
        const payload = await this.authService.validateToken(data.token);
        return {
          success: !!payload,
          auth_context: payload ? {
            user_id: payload.sub,
            email: payload.email,
            role: payload.role,
            permissions: [], // Will be filled by the caller
          } : undefined,
          error: payload ? undefined : 'Invalid token',
        };
      }
    } catch (error) {
      LoggerUtil.error('auth-service', 'gRPC ValidateToken failed', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @GrpcMethod('AuthService', 'CreateApiKey')
  async createApiKey(data: any) {
    try {
      LoggerUtil.debug('auth-service', 'gRPC CreateApiKey called', { user_id: data.user_id, name: data.name });
      
      const apiKey = await this.apiKeyService.createApiKey(data.user_id, {
        name: data.name,
        description: data.description,
        permissions: data.permissions || [],
        expiresAt: data.expires_at,
      });

      return {
        success: true,
        api_key: {
          id: apiKey.id,
          key: apiKey.key,
          user_id: apiKey.userId,
          name: apiKey.name,
          description: apiKey.description,
          is_active: apiKey.isActive,
          permissions: apiKey.permissions,
          last_used_at: apiKey.lastUsedAt?.toISOString(),
          expires_at: apiKey.expiresAt?.toISOString(),
          created_at: apiKey.createdAt.toISOString(),
        },
      };
    } catch (error) {
      LoggerUtil.error('auth-service', 'gRPC CreateApiKey failed', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @GrpcMethod('AuthService', 'ValidateApiKey')
  async validateApiKey(data: any) {
    try {
      LoggerUtil.debug('auth-service', 'gRPC ValidateApiKey called', { key: data.key });
      
      const validation = await this.apiKeyService.validateApiKey(data.key);
      return {
        success: validation.isValid,
        auth_context: validation.isValid ? {
          user_id: validation.userId,
          email: '', // Will be filled by the caller
          role: '', // Will be filled by the caller
          permissions: validation.permissions || [],
          api_key_id: data.key,
        } : undefined,
        error: validation.isValid ? undefined : 'Invalid API key',
      };
    } catch (error) {
      LoggerUtil.error('auth-service', 'gRPC ValidateApiKey failed', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
