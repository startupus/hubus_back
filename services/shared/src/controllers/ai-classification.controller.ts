import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { 
  AIClassificationRequest, 
  AIClassificationResponse,
  AICategory,
  AIClassification
} from '../types/ai-certification';
import { AIClassificationService } from '../services/ai-classification.service';

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
    return {
      categories: Object.values(AICategory)
    };
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
    const categoryInfo = this.getCategoryDescription(category as AICategory);
    return {
      category: category as AICategory,
      description: categoryInfo.description,
      useCases: categoryInfo.useCases
    };
  }

  @Get('models/:modelId/classification')
  @ApiOperation({ summary: 'Get model classification' })
  @ApiParam({ name: 'modelId', description: 'Model ID' })
  @ApiResponse({ status: 200, description: 'Classification retrieved successfully' })
  async getModelClassification(@Param('modelId') modelId: string): Promise<AIClassification | null> {
    // В реальной реализации здесь был бы запрос к базе данных
    return null;
  }

  private getCategoryDescription(category: AICategory): {
    description: string;
    useCases: string[];
  } {
    const descriptions = {
      [AICategory.TEXT_GENERATION]: {
        description: 'Models that generate human-like text content',
        useCases: ['Content creation', 'Creative writing', 'Article generation']
      },
      [AICategory.CODE_GENERATION]: {
        description: 'Models that generate programming code',
        useCases: ['Software development', 'Code completion', 'Bug fixing']
      },
      [AICategory.IMAGE_GENERATION]: {
        description: 'Models that generate images from text descriptions',
        useCases: ['Digital art', 'Product visualization', 'Marketing materials']
      },
      [AICategory.CONVERSATION]: {
        description: 'Models designed for interactive conversations',
        useCases: ['Customer support', 'Virtual assistants', 'Chatbots']
      },
      [AICategory.TRANSLATION]: {
        description: 'Models that translate text between languages',
        useCases: ['Document translation', 'Real-time communication', 'Content localization']
      },
      [AICategory.SUMMARIZATION]: {
        description: 'Models that create summaries of longer texts',
        useCases: ['News summarization', 'Document analysis', 'Research assistance']
      },
      [AICategory.QUESTION_ANSWERING]: {
        description: 'Models that answer questions based on knowledge',
        useCases: ['Educational support', 'Customer service', 'Research assistance']
      },
      [AICategory.SENTIMENT_ANALYSIS]: {
        description: 'Models that analyze emotional tone in text',
        useCases: ['Social media monitoring', 'Customer feedback analysis', 'Market research']
      },
      [AICategory.CLASSIFICATION]: {
        description: 'Models that categorize or classify data',
        useCases: ['Content moderation', 'Email filtering', 'Document organization']
      },
      [AICategory.EMBEDDING]: {
        description: 'Models that create vector representations of text',
        useCases: ['Semantic search', 'Recommendation systems', 'Similarity matching']
      },
      [AICategory.REASONING]: {
        description: 'Models that perform logical reasoning tasks',
        useCases: ['Problem solving', 'Decision support', 'Analytical tasks']
      },
      [AICategory.CREATIVE_WRITING]: {
        description: 'Models specialized in creative content generation',
        useCases: ['Story writing', 'Poetry', 'Screenplay writing']
      },
      [AICategory.TECHNICAL_WRITING]: {
        description: 'Models for technical documentation and writing',
        useCases: ['API documentation', 'Technical manuals', 'User guides']
      },
      [AICategory.EDUCATION]: {
        description: 'Models designed for educational purposes',
        useCases: ['Tutoring', 'Learning assistance', 'Educational content']
      },
      [AICategory.RESEARCH]: {
        description: 'Models for research and scientific tasks',
        useCases: ['Literature review', 'Hypothesis generation', 'Data analysis']
      },
      [AICategory.BUSINESS]: {
        description: 'Models for business applications',
        useCases: ['Business analysis', 'Strategy planning', 'Market research']
      },
      [AICategory.MEDICAL]: {
        description: 'Models for medical and healthcare applications',
        useCases: ['Medical diagnosis', 'Drug discovery', 'Health monitoring']
      },
      [AICategory.LEGAL]: {
        description: 'Models for legal applications',
        useCases: ['Legal research', 'Contract analysis', 'Compliance checking']
      },
      [AICategory.FINANCIAL]: {
        description: 'Models for financial applications',
        useCases: ['Risk assessment', 'Fraud detection', 'Investment analysis']
      },
      [AICategory.OTHER]: {
        description: 'Models that don\'t fit into specific categories',
        useCases: ['General purpose', 'Experimental', 'Specialized tasks']
      }
    };

    return descriptions[category] || {
      description: 'Unknown category',
      useCases: []
    };
  }
}
