import { Controller, Post, Body, Get, Param, Delete, Query, UseGuards, Req, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, AuthResponseDto, CreateApiKeyDto, LoggerUtil } from '@ai-aggregator/shared';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully', type: AuthResponseDto })
  async register(@Body() registerDto: RegisterDto, @Query('ref') referralCode?: string) {
    return this.authService.register(registerDto, referralCode);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('api-keys')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create API key' })
  @ApiResponse({ status: 201, description: 'API key created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async createApiKey(@Body() createApiKeyDto: CreateApiKeyDto, @Req() req: any) {
    // Debug logging
    LoggerUtil.debug('api-gateway', 'createApiKey called', { 
      name: createApiKeyDto.name, 
      nameType: typeof createApiKeyDto.name,
      nameLength: createApiKeyDto.name?.length 
    });
    
    // Manual validation as fallback
    if (!createApiKeyDto.name || createApiKeyDto.name.trim().length === 0) {
      LoggerUtil.warn('api-gateway', 'Validation failed: empty name');
      throw new HttpException('Name is required and cannot be empty', HttpStatus.BAD_REQUEST);
    }
    if (createApiKeyDto.name.length > 100) {
      LoggerUtil.warn('api-gateway', 'Validation failed: name too long');
      throw new HttpException('Name cannot exceed 100 characters', HttpStatus.BAD_REQUEST);
    }
    LoggerUtil.debug('api-gateway', 'Validation passed, creating API key');
    return this.authService.createApiKey(createApiKeyDto, req.user, req);
  }

  @Get('api-keys')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user API keys' })
  @ApiResponse({ status: 200, description: 'API keys retrieved successfully' })
  async getApiKeys(@Req() req: any) {
    return this.authService.getApiKeys(req.user, req);
  }

  @Delete('api-keys/:keyId')
  @ApiOperation({ summary: 'Revoke API key' })
  @ApiResponse({ status: 200, description: 'API key revoked successfully' })
  async revokeApiKey(@Param('keyId') keyId: string) {
    return this.authService.revokeApiKey(keyId);
  }
}

