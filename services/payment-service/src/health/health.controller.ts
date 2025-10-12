import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class HealthController {
  @Get('health')
  checkHealth(@Res() res: Response) {
    console.log('Payment Service: Health check endpoint called - START');
    try {
      const response = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'payment-service',
        version: '1.0.0',
        uptime: process.uptime(),
      };
      console.log('Payment Service: Health check response:', response);
      return res.status(HttpStatus.OK).json(response);
    } catch (error) {
      console.error('Payment Service: Health check error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        error: error.message
      });
    }
  }

  @Get()
  checkHealthRoot(@Res() res: Response) {
    console.log('Payment Service: Health check root endpoint called - START');
    try {
      const response = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'payment-service',
        version: '1.0.0',
        uptime: process.uptime(),
      };
      console.log('Payment Service: Health check root response:', response);
      return res.status(HttpStatus.OK).json(response);
    } catch (error) {
      console.error('Payment Service: Health check root error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        error: error.message
      });
    }
  }

  @Get('ready')
  checkReady(@Res() res: Response) {
    console.log('Payment Service: Readiness check endpoint called');
    return res.status(HttpStatus.OK).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      service: 'payment-service',
    });
  }

  @Get('live')
  checkLive(@Res() res: Response) {
    console.log('Payment Service: Liveness check endpoint called');
    return res.status(HttpStatus.OK).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      service: 'payment-service',
    });
  }
}