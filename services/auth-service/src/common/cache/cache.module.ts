import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TokenCacheService } from './token-cache.service';

@Module({
  imports: [ConfigModule],
  providers: [TokenCacheService],
  exports: [TokenCacheService],
})
export class CacheModule {}
