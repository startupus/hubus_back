import { Module } from '@nestjs/common';
import { BillingGrpcController } from './grpc.controller';

@Module({
  controllers: [BillingGrpcController],
  providers: [],
  exports: [],
})
export class BillingGrpcModule {}
