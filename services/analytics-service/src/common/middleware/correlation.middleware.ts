import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerUtil } from '@ai-aggregator/shared';

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Simple correlation ID generation
    const generateCorrelationId = (): string => {
      return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };

    const correlationId = req.headers['x-correlation-id'] ||
      req.headers['x-request-id'] ||
      generateCorrelationId();
    
    req['correlationId'] = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);
    
    LoggerUtil.info('analytics-service', `${req.method} ${req.url} - Request started`, {
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    }, correlationId);
    
    res.on('finish', () => {
      LoggerUtil.info('analytics-service', `${req.method} ${req.url} ${res.statusCode} - Request completed`, {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        responseTime: Date.now() - req['startTime'],
      }, correlationId);
    });
    
    req['startTime'] = Date.now();
    next();
  }
}
