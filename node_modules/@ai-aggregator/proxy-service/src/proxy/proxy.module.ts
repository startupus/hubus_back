import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';
import { AnonymizationService } from '@ai-aggregator/shared';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [ProxyController],
  providers: [ProxyService, AnonymizationService],
  exports: [ProxyService],
})
export class ProxyModule {}
