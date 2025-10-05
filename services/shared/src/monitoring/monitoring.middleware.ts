import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { ApiMonitorService } from './api-monitor.service';

@Injectable()
export class MonitoringMiddleware implements NestMiddleware {
  private readonly logger = new Logger(MonitoringMiddleware.name);

  constructor(private readonly apiMonitor: ApiMonitorService) {}

  use(req: any, res: any, next: any) {
    const startTime = Date.now();
    const originalSend = res.send;

    // Override res.send to capture response data
    res.send = function(body: any) {
      const responseTime = Date.now() - startTime;
      
      // Record metrics
      (this.apiMonitor as any).recordMetric({
        endpoint: req.path,
        method: req.method,
        responseTime,
        statusCode: res.statusCode,
        userId: (req as any).user?.id || (req as any).user?.sub,
        error: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : undefined,
      });

      // Call original send
      return originalSend.call(this, body);
    };

    next();
  }
}
