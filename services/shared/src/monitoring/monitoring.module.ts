import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiMonitorService } from './api-monitor.service';
import { HealthCheckService } from './health-check.service';

@Module({
  imports: [ConfigModule],
  providers: [ApiMonitorService, HealthCheckService],
  exports: [ApiMonitorService, HealthCheckService],
})
export class MonitoringModule {}
