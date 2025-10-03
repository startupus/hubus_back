import { Module } from '@nestjs/common';
import { ProxyGrpcController } from './grpc.controller';

@Module({
  controllers: [ProxyGrpcController],
  providers: [],
  exports: [],
})
export class ProxyGrpcModule {}
