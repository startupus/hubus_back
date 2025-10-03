import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ApiKeyService } from './api-key.service';
import { CreateApiKeyDto, UpdateApiKeyDto, ApiKeyResponseDto } from '@ai-aggregator/shared';

@ApiTags('API Keys')
@Controller('api-keys')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new API key' })
  @ApiResponse({ status: 201, description: 'API key created successfully', type: ApiKeyResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createApiKey(@Body() createApiKeyDto: CreateApiKeyDto, @Req() req: Request) {
    const userId = (req.user as any).sub;
    return this.apiKeyService.createApiKey(userId, createApiKeyDto);
  }

  @Get()
  @ApiOperation({ summary: 'List user API keys' })
  @ApiResponse({ status: 200, description: 'API keys retrieved successfully' })
  async listApiKeys(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Req() req: Request
  ) {
    const userId = (req.user as any).sub;
    return this.apiKeyService.listApiKeys(userId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get API key by ID' })
  @ApiResponse({ status: 200, description: 'API key retrieved successfully', type: ApiKeyResponseDto })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async getApiKeyById(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any).sub;
    return this.apiKeyService.getApiKeyById(id, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update API key' })
  @ApiResponse({ status: 200, description: 'API key updated successfully', type: ApiKeyResponseDto })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async updateApiKey(
    @Param('id') id: string,
    @Body() updateApiKeyDto: UpdateApiKeyDto,
    @Req() req: Request
  ) {
    const userId = (req.user as any).sub;
    return this.apiKeyService.updateApiKey(id, userId, updateApiKeyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke API key' })
  @ApiResponse({ status: 200, description: 'API key revoked successfully' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async revokeApiKey(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any).sub;
    return this.apiKeyService.revokeApiKey(id, userId);
  }
}
