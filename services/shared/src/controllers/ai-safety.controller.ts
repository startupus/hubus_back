import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { 
  AISafetyLevel,
  AISafetyAssessment,
  SafetyIncident,
  RiskFactorCategory
} from '../types/ai-certification';
import { AISafetyService, SafetyTestRequest, SafetyTestResponse } from '../services/ai-safety.service';

@ApiTags('AI Safety')
@Controller('ai/safety')
export class AISafetyController {
  constructor(private readonly safetyService: AISafetyService) {}

  @Post('assess')
  @ApiOperation({ summary: 'Conduct safety assessment' })
  @ApiResponse({ status: 200, description: 'Safety assessment completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async conductSafetyAssessment(@Body() request: SafetyTestRequest): Promise<SafetyTestResponse> {
    return this.safetyService.conductSafetyAssessment(request);
  }

  @Get('levels')
  @ApiOperation({ summary: 'Get available safety levels' })
  @ApiResponse({ status: 200, description: 'Safety levels retrieved successfully' })
  async getSafetyLevels(): Promise<{ levels: AISafetyLevel[] }> {
    return {
      levels: Object.values(AISafetyLevel)
    };
  }

  @Get('risk-categories')
  @ApiOperation({ summary: 'Get available risk categories' })
  @ApiResponse({ status: 200, description: 'Risk categories retrieved successfully' })
  async getRiskCategories(): Promise<{ categories: RiskFactorCategory[] }> {
    return {
      categories: Object.values(RiskFactorCategory)
    };
  }

  @Get('models/:modelId/assessment')
  @ApiOperation({ summary: 'Get model safety assessment' })
  @ApiParam({ name: 'modelId', description: 'Model ID' })
  @ApiResponse({ status: 200, description: 'Assessment retrieved successfully' })
  async getModelAssessment(@Param('modelId') modelId: string): Promise<AISafetyAssessment | null> {
    // В реальной реализации здесь был бы запрос к базе данных
    return null;
  }

  @Get('models/:modelId/incidents')
  @ApiOperation({ summary: 'Get model safety incidents' })
  @ApiParam({ name: 'modelId', description: 'Model ID' })
  @ApiQuery({ name: 'severity', required: false, description: 'Filter by severity' })
  @ApiResponse({ status: 200, description: 'Incidents retrieved successfully' })
  async getModelIncidents(
    @Param('modelId') modelId: string,
    @Query('severity') severity?: string
  ): Promise<{ incidents: SafetyIncident[] }> {
    // В реальной реализации здесь был бы запрос к базе данных
    return { incidents: [] };
  }

  @Post('incidents')
  @ApiOperation({ summary: 'Report safety incident' })
  @ApiResponse({ status: 200, description: 'Incident reported successfully' })
  async reportIncident(@Body() incident: Omit<SafetyIncident, 'id'> & { modelId: string }): Promise<SafetyIncident> {
    return this.safetyService.reportSafetyIncident(incident);
  }

  @Get('models/:modelId/statistics')
  @ApiOperation({ summary: 'Get model safety statistics' })
  @ApiParam({ name: 'modelId', description: 'Model ID' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getSafetyStatistics(@Param('modelId') modelId: string): Promise<{
    totalIncidents: number;
    criticalIncidents: number;
    resolvedIncidents: number;
    averageResolutionTime: number;
  }> {
    return this.safetyService.getSafetyStatistics(modelId);
  }

  @Get('levels/:level/description')
  @ApiOperation({ summary: 'Get safety level description' })
  @ApiParam({ name: 'level', description: 'Safety level' })
  @ApiResponse({ status: 200, description: 'Description retrieved successfully' })
  async getSafetyLevelDescription(@Param('level') level: AISafetyLevel): Promise<{
    level: AISafetyLevel;
    description: string;
    requirements: string[];
    restrictions: string[];
  }> {
    const levelInfo = this.getSafetyLevelInfo(level);
    
    return {
      level,
      description: levelInfo.description,
      requirements: levelInfo.requirements,
      restrictions: levelInfo.restrictions
    };
  }

  private getSafetyLevelInfo(level: AISafetyLevel): {
    description: string;
    requirements: string[];
    restrictions: string[];
  } {
    const levelInfo = {
      [AISafetyLevel.SAFE]: {
        description: 'Model is safe for general use with minimal restrictions',
        requirements: [
          'Passes all safety tests',
          'Low bias scores',
          'No harmful content generation',
          'Regular monitoring'
        ],
        restrictions: []
      },
      [AISafetyLevel.CAUTION]: {
        description: 'Model requires caution and monitoring during use',
        requirements: [
          'Passes most safety tests',
          'Acceptable bias levels',
          'Content filtering recommended',
          'Regular monitoring required'
        ],
        restrictions: [
          'Human oversight recommended',
          'Content review for sensitive applications'
        ]
      },
      [AISafetyLevel.WARNING]: {
        description: 'Model has significant safety concerns requiring careful management',
        requirements: [
          'Passes basic safety tests',
          'Bias mitigation required',
          'Strong content filtering',
          'Continuous monitoring'
        ],
        restrictions: [
          'Human oversight mandatory',
          'Limited use cases',
          'Regular safety audits'
        ]
      },
      [AISafetyLevel.DANGEROUS]: {
        description: 'Model poses significant risks and requires strict controls',
        requirements: [
          'Enhanced safety measures',
          'Comprehensive bias mitigation',
          'Advanced content filtering',
          '24/7 monitoring'
        ],
        restrictions: [
          'Expert oversight required',
          'Highly restricted use cases',
          'Frequent safety assessments',
          'Incident response procedures'
        ]
      },
      [AISafetyLevel.RESTRICTED]: {
        description: 'Model is restricted due to critical safety issues',
        requirements: [
          'Critical safety fixes required',
          'Complete bias elimination',
          'Maximum security measures',
          'Constant monitoring'
        ],
        restrictions: [
          'Research use only',
          'Expert supervision mandatory',
          'No public deployment',
          'Immediate incident response'
        ]
      }
    };

    return levelInfo[level] || levelInfo[AISafetyLevel.SAFE];
  }
}
