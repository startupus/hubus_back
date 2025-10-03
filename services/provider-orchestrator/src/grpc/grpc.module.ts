import { Module } from '@nestjs/common';
import { OrchestratorGrpcController } from './grpc.controller';

@Module({
  controllers: [OrchestratorGrpcController],
  providers: [],
  exports: [],
})
export class OrchestratorGrpcModule {}
