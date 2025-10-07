import { Controller, Get, Query, UseGuards, Request, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NeuralNetworkRecommendationService } from './neural-network-recommendation.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { LoggerUtil } from '@ai-aggregator/shared';

@ApiTags('Neural Network Recommendations')
@Controller('neural-networks')
export class NeuralNetworkRecommendationController {
  constructor(
    private readonly recommendationService: NeuralNetworkRecommendationService
  ) {}

  @Get('recommendations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get neural network recommendations',
    description: 'Get personalized recommendations for neural networks based on popularity and user preferences'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Recommendations retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            recommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  provider: { type: 'string' },
                  model: { type: 'string' },
                  reason: { type: 'string' },
                  score: { type: 'number' },
                  isDefault: { type: 'boolean' },
                  stats: {
                    type: 'object',
                    properties: {
                      totalRequests: { type: 'number' },
                      avgResponseTime: { type: 'number' },
                      successRate: { type: 'number' }
                    }
                  }
                }
              }
            },
            total: { type: 'number' },
            hasRussianDefaults: { type: 'boolean' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of recommendations (default: 10)' })
  @ApiQuery({ name: 'includeRussian', required: false, type: Boolean, description: 'Include Russian neural networks (default: true)' })
  async getRecommendations(
    @Request() req: any,
    @Query('limit') limit?: number,
    @Query('includeRussian') includeRussian?: boolean
  ) {
    try {
      const userId = req.user?.id;
      const request = {
        userId,
        limit: limit || 10,
        includeRussian: includeRussian !== false // default true
      };

      LoggerUtil.info('analytics-service', 'Getting neural network recommendations', {
        userId,
        limit: request.limit,
        includeRussian: request.includeRussian
      });

      const recommendations = await this.recommendationService.getRecommendations(request);

      return {
        success: true,
        data: recommendations
      };
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to get recommendations', error as Error, {
        userId: req.user?.id
      });
      throw new HttpException('Failed to get recommendations', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('popular')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get most popular neural networks',
    description: 'Get the most popular neural networks based on usage statistics'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Popular neural networks retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              provider: { type: 'string' },
              model: { type: 'string' },
              totalRequests: { type: 'number' },
              totalTokens: { type: 'number' },
              totalCost: { type: 'number' },
              uniqueUsers: { type: 'number' },
              avgResponseTime: { type: 'number' },
              successRate: { type: 'number' },
              lastUsed: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of results (default: 10)' })
  async getPopular(
    @Query('limit') limit?: number
  ) {
    try {
      const popular = await this.recommendationService.getTopPopular(limit || 10);

      return {
        success: true,
        data: popular
      };
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to get popular neural networks', error as Error);
      throw new HttpException('Failed to get popular neural networks', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('stats/:provider')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get neural network statistics by provider',
    description: 'Get detailed statistics for all models of a specific provider'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Provider statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              provider: { type: 'string' },
              model: { type: 'string' },
              totalRequests: { type: 'number' },
              totalTokens: { type: 'number' },
              totalCost: { type: 'number' },
              uniqueUsers: { type: 'number' },
              avgResponseTime: { type: 'number' },
              successRate: { type: 'number' },
              lastUsed: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getProviderStats(
    @Request() req: any,
    @Query('provider') provider: string
  ) {
    try {
      if (!provider) {
        throw new HttpException('Provider parameter is required', HttpStatus.BAD_REQUEST);
      }

      const stats = await this.recommendationService.getProviderStats(provider);

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to get provider stats', error as Error, {
        provider: req.query.provider
      });
      
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to get provider statistics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('russian-defaults')
  @ApiOperation({ 
    summary: 'Get Russian neural networks by default',
    description: 'Get the default Russian neural networks that are recommended when no statistics are available'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Russian defaults retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              provider: { type: 'string' },
              model: { type: 'string' },
              reason: { type: 'string' },
              score: { type: 'number' },
              description: { type: 'string' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getRussianDefaults() {
    try {
      const russianDefaults = [
        {
          provider: 'yandex',
          model: 'yandex-gpt',
          reason: 'russian',
          score: 100,
          description: 'Yandex GPT - российская языковая модель'
        },
        {
          provider: 'sber',
          model: 'gigachat',
          reason: 'russian',
          score: 95,
          description: 'GigaChat - ИИ-модель от Сбера'
        },
        {
          provider: 'sber',
          model: 'kandinsky',
          reason: 'russian',
          score: 90,
          description: 'Kandinsky - генерация изображений от Сбера'
        }
      ];

      return {
        success: true,
        data: russianDefaults
      };
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to get Russian defaults', error as Error);
      throw new HttpException('Failed to get Russian defaults', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
