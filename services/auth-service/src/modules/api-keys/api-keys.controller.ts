import { Controller, Get, Post, Put, Delete, Param, Body, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto, UpdateApiKeyDto } from './dto/api-keys.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@ApiTags('api-keys')
@Controller('api-keys')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  @ApiOperation({ summary: 'Get all API keys for the authenticated company' })
  @ApiResponse({ status: 200, description: 'API keys retrieved successfully' })
  async getApiKeys(@Request() req) {
    const companyId = req.user.companyId || req.user.sub;
    return this.apiKeysService.getApiKeys(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get API key by ID' })
  @ApiParam({ name: 'id', description: 'API key ID' })
  @ApiResponse({ status: 200, description: 'API key retrieved successfully' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async getApiKey(@Param('id') id: string, @Request() req) {
    const companyId = req.user.companyId || req.user.sub;
    return this.apiKeysService.getApiKey(id, companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new API key' })
  @ApiResponse({ status: 201, description: 'API key created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async createApiKey(@Body() createApiKeyDto: CreateApiKeyDto, @Request() req) {
    const companyId = req.user.companyId || req.user.sub;
    return this.apiKeysService.createApiKey(createApiKeyDto, companyId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update API key' })
  @ApiParam({ name: 'id', description: 'API key ID' })
  @ApiResponse({ status: 200, description: 'API key updated successfully' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async updateApiKey(
    @Param('id') id: string,
    @Body() updateApiKeyDto: UpdateApiKeyDto,
    @Request() req
  ) {
    const companyId = req.user.companyId || req.user.sub;
    return this.apiKeysService.updateApiKey(id, updateApiKeyDto, companyId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete API key' })
  @ApiParam({ name: 'id', description: 'API key ID' })
  @ApiResponse({ status: 200, description: 'API key deleted successfully' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async deleteApiKey(@Param('id') id: string, @Request() req) {
    const companyId = req.user.companyId || req.user.sub;
    return this.apiKeysService.deleteApiKey(id, companyId);
  }

  @Post(':id/regenerate')
  @ApiOperation({ summary: 'Regenerate API key' })
  @ApiParam({ name: 'id', description: 'API key ID' })
  @ApiResponse({ status: 200, description: 'API key regenerated successfully' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async regenerateApiKey(@Param('id') id: string, @Request() req) {
    const companyId = req.user.companyId || req.user.sub;
    return this.apiKeysService.regenerateApiKey(id, companyId);
  }

  @Post(':id/toggle')
  @ApiOperation({ summary: 'Toggle API key active status' })
  @ApiParam({ name: 'id', description: 'API key ID' })
  @ApiResponse({ status: 200, description: 'API key status toggled successfully' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async toggleApiKey(@Param('id') id: string, @Request() req) {
    const companyId = req.user.companyId || req.user.sub;
    return this.apiKeysService.toggleApiKey(id, companyId);
  }
}
