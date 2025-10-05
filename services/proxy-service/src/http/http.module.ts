import { Module } from '@nestjs/common';
import { HttpController } from './http.controller';
import { ProxyModule } from '../proxy/proxy.module';

@Module({
  imports: [ProxyModule],
  controllers: [HttpController],
})
export class HttpModule {}
