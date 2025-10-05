import { Controller, Get, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OrchestratorService } from './orchestrator.service';

@ApiTags('Orchestrator')
@Controller('orchestrator')
export class OrchestratorController {
  constructor(private readonly orchestratorService: OrchestratorService) {}

  @Get('models')
  @ApiOperation({ summary: 'Get available AI models' })
  @ApiResponse({ status: 200, description: 'Models retrieved successfully' })
  async getModels() {
    try {
      return await this.orchestratorService.getModels();
    } catch (error) {
      throw new HttpException(
        'Failed to get models',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('route-request')
  @ApiOperation({ summary: 'Route request to optimal provider' })
  @ApiResponse({ status: 200, description: 'Request routed successfully' })
  async routeRequest(@Body() requestData: any) {
    try {
      return await this.orchestratorService.routeRequest(requestData);
    } catch (error) {
      throw new HttpException(
        'Failed to route request',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
