import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EmployeeStatsController } from './employee-stats.controller';
import { EmployeeStatsService } from './employee-stats.service';

@Module({
  imports: [HttpModule],
  controllers: [EmployeeStatsController],
  providers: [EmployeeStatsService],
  exports: [EmployeeStatsService],
})
export class EmployeeStatsModule {}
