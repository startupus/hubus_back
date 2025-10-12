import { Module } from '@nestjs/common';
import { HttpController } from './http.controller';
import { AuthModule } from '../modules/auth/auth.module';
import { ApiKeyModule } from '../modules/api-key/api-key.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [AuthModule, ApiKeyModule, PassportModule],
  controllers: [HttpController],
})
export class AuthHttpModule {}
