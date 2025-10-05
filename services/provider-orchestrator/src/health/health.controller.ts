import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { LoggerUtil } from '@ai-aggregator/shared';

@Controller('health')
export class HealthController {
  @Get()
  checkHealth(@Res() res: Response) {
    LoggerUtil.debug('provider-orchestrator', 'Health check endpoint called');
    return res.status(HttpStatus.OK).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'provider-orchestrator',
      version: '1.0.0',
      uptime: process.uptime(),
    });
  }
}
