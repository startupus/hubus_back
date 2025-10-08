import { NestMiddleware } from '@nestjs/common';
import { ApiMonitorService } from './api-monitor.service';
export declare class MonitoringMiddleware implements NestMiddleware {
    private readonly apiMonitor;
    private readonly logger;
    constructor(apiMonitor: ApiMonitorService);
    use(req: any, res: any, next: any): void;
}
//# sourceMappingURL=monitoring.middleware.d.ts.map