import { Module } from '@nestjs/common';
import { HttpModule, HttpService } from '@nestjs/axios';
import axios from 'axios';
import { ConfigModule } from '@nestjs/config';
import { OrchestratorService } from './orchestrator.service';
import { OrchestratorCacheService } from './orchestrator-cache.service';
import { ConcurrentOrchestratorService } from './concurrent-orchestrator.service';
import { RedisClient } from '@ai-aggregator/shared';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 3,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    })
  ],
  providers: [
    OrchestratorService,
    OrchestratorCacheService,
    ConcurrentOrchestratorService,
    RedisClient
  ],
  exports: [
    OrchestratorService,
    OrchestratorCacheService,
    ConcurrentOrchestratorService
  ],
})
export class OrchestratorModule {}
