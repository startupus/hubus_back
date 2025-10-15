import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

@Module({
  imports: [HttpModule],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
