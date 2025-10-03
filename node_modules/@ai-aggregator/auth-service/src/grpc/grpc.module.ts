import { Module } from '@nestjs/common';
import { GrpcController } from './grpc.controller';
import { AuthModule } from '../modules/auth/auth.module';
import { ApiKeyModule } from '../modules/api-key/api-key.module';
import { UserModule } from '../modules/user/user.module';

@Module({
  imports: [AuthModule, ApiKeyModule, UserModule],
  providers: [GrpcController],
})
export class GrpcModule {}
