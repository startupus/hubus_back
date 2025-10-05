import { Module } from '@nestjs/common';
import { HttpController } from './http.controller';
import { OrchestratorModule } from '../orchestrator/orchestrator.module';

@Module({
  imports: [OrchestratorModule],
  controllers: [HttpController],
})
export class HttpModule {}
