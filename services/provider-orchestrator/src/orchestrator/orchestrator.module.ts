import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
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
    // OrchestratorService, // Временно отключен для диагностики
    // OrchestratorCacheService, // Временно отключен для диагностики
    // ConcurrentOrchestratorService, // Временно отключен для диагностики
    // RedisClient, // Временно отключен для диагностики
  ],
  exports: [
    // OrchestratorService, // Временно отключен для диагностики
    // OrchestratorCacheService, // Временно отключен для диагностики
    // ConcurrentOrchestratorService // Временно отключен для диагностики
  ],
})
export class OrchestratorModule {}
