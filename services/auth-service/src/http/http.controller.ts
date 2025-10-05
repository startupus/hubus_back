import { Controller, Post, Get, Body, Param, Query, HttpCode, HttpStatus, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../modules/auth/auth.service';
import { ApiKeyService } from '../modules/api-key/api-key.service';
import { UserService } from '../modules/user/user.service';
import { LoggerUtil } from '@ai-aggregator/shared';
import { RegisterDto, LoginDto } from '@ai-aggregator/shared';

@ApiTags('auth')
@Controller('auth')
export class HttpController {
  constructor(
    private readonly authService: AuthService,
    private readonly apiKeyService: ApiKeyService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 6 },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        role: { type: 'string', default: 'user' }
      },
      required: ['email', 'password', 'firstName', 'lastName']
    }
  })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createUser(@Body(ValidationPipe) data: RegisterDto) {
    try {
      LoggerUtil.debug('auth-service', 'HTTP CreateUser called', { email: data.email });
      
      const result = await this.authService.register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });

      return {
        success: result.success,
        user: result.user ? {
          id: result.user.id,
          email: result.user.email,
          isActive: result.user.isActive,
          isVerified: result.user.isVerified,
          role: result.user.role,
          firstName: data.firstName,
          lastName: data.lastName,
          createdAt: result.user.createdAt.toISOString(),
          updatedAt: result.user.updatedAt.toISOString(),
        } : undefined,
        error: result.error,
      };
    } catch (error) {
      LoggerUtil.error('auth-service', 'HTTP CreateUser failed', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Get('user')
  @ApiOperation({ summary: 'Get user by ID or email' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(@Query('id') id?: string, @Query('email') email?: string) {
    try {
      LoggerUtil.debug('auth-service', 'HTTP GetUser called', { id, email });
      
      let user;
      if (id) {
        user = await this.userService.getUserById(id);
      } else if (email) {
        user = await this.userService.getUserByEmail(email);
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
          isActive: user.isActive,
          isVerified: user.isVerified,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
          lastLoginAt: user.lastLoginAt?.toISOString(),
        },
      };
    } catch (error) {
      LoggerUtil.error('auth-service', 'HTTP GetUser failed', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string' },
        ipAddress: { type: 'string' },
        userAgent: { type: 'string' }
      },
      required: ['email', 'password']
    }
  })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body(ValidationPipe) data: LoginDto, @Req() req: any) {
    try {
      LoggerUtil.debug('auth-service', 'HTTP Login called', { email: data.email });
      
      const result = await this.authService.login({
        email: data.email,
        password: data.password,
      }, req.ip, req.get('User-Agent'));

      return {
        success: result.success,
        accessToken: result.token,
        refreshToken: result.refreshToken,
        user: result.user ? {
          id: result.user.id,
          email: result.user.email,
          isActive: result.user.isActive,
          isVerified: result.user.isVerified,
          role: result.user.role,
          firstName: (result.user as any).firstName || '',
          lastName: (result.user as any).lastName || '',
          createdAt: result.user.createdAt.toISOString(),
          updatedAt: result.user.updatedAt.toISOString(),
          lastLoginAt: result.user.lastLoginAt?.toISOString(),
        } : undefined,
        error: result.error,
        requiresVerification: result.requiresVerification,
      };
    } catch (error) {
      LoggerUtil.error('auth-service', 'HTTP Login failed', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Post('validate-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string' },
        tokenType: { type: 'string', enum: ['access', 'api_key'] }
      },
      required: ['token', 'tokenType']
    }
  })
  @ApiResponse({ status: 200, description: 'Token validation result' })
  async validateToken(@Body() data: any) {
    try {
      LoggerUtil.debug('auth-service', 'HTTP ValidateToken called', { tokenType: data.tokenType });
      
      if (data.tokenType === 'api_key') {
        const validation = await this.apiKeyService.validateApiKey(data.token);
        return {
          success: validation.isValid,
          authContext: validation.isValid ? {
            userId: validation.userId,
            email: '', // Will be filled by the caller
            role: '', // Will be filled by the caller
            permissions: validation.permissions || [],
            apiKeyId: data.token,
          } : undefined,
          error: validation.isValid ? undefined : 'Invalid API key',
        };
      } else {
        const payload = await this.authService.validateToken(data.token);
        return {
          success: !!payload,
          authContext: payload ? {
            userId: payload.sub,
            email: payload.email,
            role: payload.role,
            permissions: [], // Will be filled by the caller
          } : undefined,
          error: payload ? undefined : 'Invalid token',
        };
      }
    } catch (error) {
      LoggerUtil.error('auth-service', 'HTTP ValidateToken failed', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Post('api-keys')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create API key' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        permissions: { type: 'array', items: { type: 'string' } },
        expiresAt: { type: 'string', format: 'date-time' }
      },
      required: ['name']
    }
  })
  @ApiResponse({ status: 201, description: 'API key created successfully' })
  async createApiKey(@Body() data: any, @Req() req: any) {
    try {
      LoggerUtil.debug('auth-service', 'HTTP CreateApiKey called - req.user', { reqUser: req.user, name: data.name });
      const userId = req.user?.sub;
      LoggerUtil.debug('auth-service', 'HTTP CreateApiKey called - extracted userId', { userId, name: data.name });
      
      const apiKey = await this.apiKeyService.createApiKey(userId, {
        name: data.name,
        description: data.description,
        permissions: data.permissions || [],
        expiresAt: data.expiresAt,
      });

      return {
        success: true,
        apiKey: {
          id: apiKey.id,
          key: apiKey.key,
          userId: apiKey.userId,
          name: apiKey.name,
          description: apiKey.description,
          isActive: apiKey.isActive,
          permissions: apiKey.permissions,
          lastUsedAt: apiKey.lastUsedAt?.toISOString(),
          expiresAt: apiKey.expiresAt?.toISOString(),
          createdAt: apiKey.createdAt.toISOString(),
        },
      };
    } catch (error) {
      LoggerUtil.error('auth-service', 'HTTP CreateApiKey failed', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Post('api-keys/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate API key' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        key: { type: 'string' }
      },
      required: ['key']
    }
  })
  @ApiResponse({ status: 200, description: 'API key validation result' })
  async validateApiKey(@Body() data: any) {
    try {
      LoggerUtil.debug('auth-service', 'HTTP ValidateApiKey called', { key: data.key });
      
      const validation = await this.apiKeyService.validateApiKey(data.key);
      return {
        success: validation.isValid,
        authContext: validation.isValid ? {
          userId: validation.userId,
          email: '', // Will be filled by the caller
          role: '', // Will be filled by the caller
          permissions: validation.permissions || [],
          apiKeyId: data.key,
        } : undefined,
        error: validation.isValid ? undefined : 'Invalid API key',
      };
    } catch (error) {
      LoggerUtil.error('auth-service', 'HTTP ValidateApiKey failed', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
