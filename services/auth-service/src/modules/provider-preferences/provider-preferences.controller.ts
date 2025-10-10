import { Controller, Get, Post, Put, Delete, Param, Body, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { ProviderPreferencesService, CreateProviderPreferenceDto, UpdateProviderPreferenceDto } from './provider-preferences.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ApiKeyAuthGuard } from '../auth/guards/api-key-auth.guard';

@ApiTags('provider-preferences')
@Controller('provider-preferences')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProviderPreferencesController {
  constructor(private readonly providerPreferencesService: ProviderPreferencesService) {}

  @Post()
  @ApiOperation({ summary: 'Set provider preference for a model' })
  @ApiResponse({ status: 201, description: 'Provider preference set successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async setProviderPreference(@Request() req, @Body() dto: CreateProviderPreferenceDto) {
    return this.providerPreferencesService.setProviderPreference(req.user.companyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all provider preferences for the company' })
  @ApiResponse({ status: 200, description: 'Provider preferences retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProviderPreferences(@Request() req) {
    return this.providerPreferencesService.getProviderPreferences(req.user.companyId);
  }

  @Get('model/:model')
  @ApiOperation({ summary: 'Get provider preference for a specific model' })
  @ApiParam({ name: 'model', description: 'Model name (e.g., gpt-4, claude-3-sonnet)' })
  @ApiResponse({ status: 200, description: 'Provider preference retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Provider preference not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProviderPreferenceForModel(@Request() req, @Param('model') model: string) {
    return this.providerPreferencesService.getProviderPreferenceForModel(req.user.companyId, model);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update provider preference' })
  @ApiParam({ name: 'id', description: 'Provider preference ID' })
  @ApiResponse({ status: 200, description: 'Provider preference updated successfully' })
  @ApiResponse({ status: 404, description: 'Provider preference not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProviderPreference(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateProviderPreferenceDto
  ) {
    return this.providerPreferencesService.updateProviderPreference(req.user.companyId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete provider preference' })
  @ApiParam({ name: 'id', description: 'Provider preference ID' })
  @ApiResponse({ status: 204, description: 'Provider preference deleted successfully' })
  @ApiResponse({ status: 404, description: 'Provider preference not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteProviderPreference(@Request() req, @Param('id') id: string) {
    await this.providerPreferencesService.deleteProviderPreference(req.user.companyId, id);
    return { message: 'Provider preference deleted successfully' };
  }

  @Get('available-providers/:model')
  @ApiOperation({ summary: 'Get available providers for a model' })
  @ApiParam({ name: 'model', description: 'Model name (e.g., gpt-4, claude-3-sonnet)' })
  @ApiResponse({ status: 200, description: 'Available providers retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAvailableProvidersForModel(@Param('model') model: string) {
    const providers = await this.providerPreferencesService.getAvailableProvidersForModel(model);
    return { model, availableProviders: providers };
  }

  @Get('recommended/:model')
  @ApiOperation({ summary: 'Get recommended provider for a model' })
  @ApiParam({ name: 'model', description: 'Model name (e.g., gpt-4, claude-3-sonnet)' })
  @ApiResponse({ status: 200, description: 'Recommended provider retrieved successfully' })
  @ApiResponse({ status: 400, description: 'No providers available for model' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRecommendedProvider(@Request() req, @Param('model') model: string) {
    return this.providerPreferencesService.getRecommendedProvider(req.user.companyId, model);
  }
}

// Контроллер для API ключей (без JWT аутентификации)
@ApiTags('provider-preferences-api')
@Controller('api/provider-preferences')
@UseGuards(ApiKeyAuthGuard)
export class ProviderPreferencesApiController {
  constructor(private readonly providerPreferencesService: ProviderPreferencesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all provider preferences for the company (API Key auth)' })
  @ApiResponse({ status: 200, description: 'Provider preferences retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - API key required' })
  async getProviderPreferences(@Request() req) {
    return this.providerPreferencesService.getProviderPreferences(req.user.companyId);
  }

  @Get('model/:model')
  @ApiOperation({ summary: 'Get provider preference for a specific model (API Key auth)' })
  @ApiParam({ name: 'model', description: 'Model name (e.g., gpt-4, claude-3-sonnet)' })
  @ApiResponse({ status: 200, description: 'Provider preference retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Provider preference not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - API key required' })
  async getProviderPreferenceForModel(@Request() req, @Param('model') model: string) {
    return this.providerPreferencesService.getProviderPreferenceForModel(req.user.companyId, model);
  }

  @Get('recommended/:model')
  @ApiOperation({ summary: 'Get recommended provider for a model (API Key auth)' })
  @ApiParam({ name: 'model', description: 'Model name (e.g., gpt-4, claude-3-sonnet)' })
  @ApiResponse({ status: 200, description: 'Recommended provider retrieved successfully' })
  @ApiResponse({ status: 400, description: 'No providers available for model' })
  @ApiResponse({ status: 401, description: 'Unauthorized - API key required' })
  async getRecommendedProvider(@Request() req, @Param('model') model: string) {
    return this.providerPreferencesService.getRecommendedProvider(req.user.companyId, model);
  }
}
