import { Module } from '@nestjs/common';
import { OrchestratorController } from './orchestrator.controller';

@Module({
  controllers: [OrchestratorController],
  providers: [],
  exports: [],
})
export class OrchestratorModule {}
