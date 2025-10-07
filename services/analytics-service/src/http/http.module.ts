import { Module } from '@nestjs/common';
import { HttpController } from './http.controller';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [AnalyticsModule],
  controllers: [HttpController],
  providers: [],
})
export class AnalyticsHttpModule {}
