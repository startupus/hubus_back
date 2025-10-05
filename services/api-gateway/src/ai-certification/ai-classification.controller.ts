import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { 
  AIClassificationRequest, 
  AIClassificationResponse,
  AICategory,
  AIClassification
} from '@ai-aggregator/shared';
import { AIClassificationService } from './ai-classification.service';

@ApiTags('AI Classification')
@Controller('ai/classification')
export class AIClassificationController {
  constructor(private readonly classificationService: AIClassificationService) {}

  @Post('classify')
  @ApiOperation({ summary: 'Classify AI model' })
  @ApiResponse({ status: 200, description: 'Model classified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async classifyModel(@Body() request: AIClassificationRequest): Promise<AIClassificationResponse> {
    return this.classificationService.classifyModel(request);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get available AI categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getCategories(): Promise<{ categories: AICategory[] }> {
    return this.classificationService.getCategories();
  }

  @Get('categories/:category')
  @ApiOperation({ summary: 'Get category information' })
  @ApiParam({ name: 'category', description: 'Category name' })
  @ApiResponse({ status: 200, description: 'Category info retrieved successfully' })
  async getCategoryInfo(@Param('category') category: string): Promise<{
    category: AICategory;
    description: string;
    useCases: string[];
  }> {
    return this.classificationService.getCategoryInfo(category);
  }

  @Get('models/:modelId/classification')
  @ApiOperation({ summary: 'Get model classification' })
  @ApiParam({ name: 'modelId', description: 'Model ID' })
  @ApiResponse({ status: 200, description: 'Classification retrieved successfully' })
  async getModelClassification(@Param('modelId') modelId: string): Promise<AIClassification | null> {
    return this.classificationService.getModelClassification(modelId);
  }
}
