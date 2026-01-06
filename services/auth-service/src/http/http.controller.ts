import { Controller, Post, Get, Body, Param, Query, HttpCode, HttpStatus, Req, UseGuards, ValidationPipe, HttpException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../modules/auth/auth.service';
import { ApiKeyService } from '../modules/api-key/api-key.service';
import { CompanyService } from '../modules/auth/company.service';
import { LoggerUtil } from '@ai-aggregator/shared';
import { RegisterDto, LoginDto, CreateApiKeyDto } from '@ai-aggregator/shared';

@ApiTags('auth')
@Controller('auth')
export class HttpController {
  constructor(
    private readonly authService: AuthService,
    private readonly apiKeyService: ApiKeyService,
    private readonly companyService: CompanyService,
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
        company: result.company ? {
          id: result.company.id,
          email: result.company.email,
          isActive: result.company.isActive,
          isVerified: result.company.isVerified,
          role: result.company.role,
          firstName: data.firstName,
          lastName: data.lastName,
          createdAt: result.company.createdAt.toISOString(),
          updatedAt: result.company.updatedAt.toISOString(),
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
        user = await this.companyService.getCompanyById(id);
      } else if (email) {
        user = await this.companyService.getCompanyByEmail(email);
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
        company: result.company ? {
          id: result.company.id,
          email: result.company.email,
          isActive: result.company.isActive,
          isVerified: result.company.isVerified,
          role: result.company.role,
          firstName: (result.company as any).firstName || '',
          lastName: (result.company as any).lastName || '',
          createdAt: result.company.createdAt.toISOString(),
          updatedAt: result.company.updatedAt.toISOString(),
          lastLoginAt: result.company.lastLoginAt?.toISOString(),
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


  @Get('validate-token')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Validate JWT token' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 401, description: 'Token is invalid' })
  async validateToken(@Req() req: any) {
    return {
      valid: true,
      user: req.user
    };
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
  async createApiKey(@Body() data: CreateApiKeyDto, @Req() req: any) {
    
    console.log('=== HttpController.createApiKey called ===');
    console.log('data:', data);
    console.log('name:', data.name);
    console.log('name type:', typeof data.name);
    console.log('name length:', data.name?.length);
    
    try {
      LoggerUtil.debug('auth-service', 'HTTP CreateApiKey called', { 
        reqUser: req.user, 
        name: data.name, 
        nameType: typeof data.name,
        nameLength: data.name?.length,
        dataKeys: Object.keys(data)
      });
      
      // Manual validation
      if (!data.name || data.name.trim().length === 0) {
        LoggerUtil.warn('auth-service', 'Validation failed: empty name', { name: data.name, nameLength: data.name?.length });
        throw new HttpException('Name is required and cannot be empty', HttpStatus.BAD_REQUEST);
      }
      if (data.name.length > 100) {
        LoggerUtil.warn('auth-service', 'Validation failed: name too long', { name: data.name, nameLength: data.name.length });
        throw new HttpException('Name cannot exceed 100 characters', HttpStatus.BAD_REQUEST);
      }
      
      LoggerUtil.debug('auth-service', 'Validation passed, creating API key');
      
      const companyId = req.user?.sub;
      LoggerUtil.debug('auth-service', 'HTTP CreateApiKey called - extracted companyId', { companyId, name: data.name });

      const apiKey = await this.apiKeyService.createApiKey(companyId, {
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
          companyId: apiKey.companyId,
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
        error: error instanceof Error ? (error as Error).message : String(error),
      };
    }
  }

  @Get('api-keys')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get user API keys' })
  @ApiResponse({ status: 200, description: 'API keys retrieved successfully' })
  async getApiKeys(@Req() req: any) {
    try {
      const companyId = req.user?.sub;
      LoggerUtil.debug('auth-service', 'HTTP GetApiKeys called', { companyId });

      const apiKeys = await this.apiKeyService.getApiKeysByCompanyId(companyId);

      return {
        success: true,
        apiKeys: apiKeys.map(key => ({
          id: key.id,
          key: key.key, // Возвращаем ключ для отображения
          name: key.name,
          description: key.description,
          isActive: key.isActive,
          permissions: key.permissions,
          lastUsedAt: key.lastUsedAt?.toISOString(),
          expiresAt: key.expiresAt?.toISOString(),
          createdAt: key.createdAt.toISOString(),
        })),
      };
    } catch (error) {
      LoggerUtil.error('auth-service', 'HTTP GetApiKeys failed', error as Error);
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
          companyId: validation.companyId,
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
