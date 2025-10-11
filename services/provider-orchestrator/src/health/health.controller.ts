import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('health')
export class HealthController {
  @Get()
  checkHealth(@Res() res: Response) {
    console.log('Provider Orchestrator: Health check endpoint called');
    return res.status(HttpStatus.OK).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'provider-orchestrator',
      version: '1.0.0',
      uptime: process.uptime(),
    });
  }

  @Get('ready')
  checkReady(@Res() res: Response) {
    console.log('Provider Orchestrator: Readiness check endpoint called');
    return res.status(HttpStatus.OK).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      service: 'provider-orchestrator',
    });
  }

  @Get('live')
  checkLive(@Res() res: Response) {
    console.log('Provider Orchestrator: Liveness check endpoint called');
    return res.status(HttpStatus.OK).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      service: 'provider-orchestrator',
    });
  }
}