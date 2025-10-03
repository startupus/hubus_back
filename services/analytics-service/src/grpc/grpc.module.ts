import { Module } from '@nestjs/common';
import { AnalyticsGrpcController } from './grpc.controller';

@Module({
  controllers: [AnalyticsGrpcController],
  providers: [],
  exports: [],
})
export class AnalyticsGrpcModule {}
