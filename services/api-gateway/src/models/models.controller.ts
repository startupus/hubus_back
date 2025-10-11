import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ModelsService } from './models.service';

@ApiTags('Models')
@Controller('models')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @Get()
  @ApiOperation({ summary: 'Get available AI models' })
  @ApiResponse({ status: 200, description: 'Models retrieved successfully' })
  @ApiQuery({ name: 'provider', required: false, description: 'Filter by provider' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  async getModels(
    @Query('provider') provider?: string,
    @Query('category') category?: string,
  ) {
    return await this.modelsService.getModels(provider, category);
  }

  @Get('providers')
  @ApiOperation({ summary: 'Get available providers' })
  @ApiResponse({ status: 200, description: 'Providers retrieved successfully' })
  async getProviders() {
    return await this.modelsService.getProviders();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get available model categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getCategories() {
    return await this.modelsService.getCategories();
  }
}
