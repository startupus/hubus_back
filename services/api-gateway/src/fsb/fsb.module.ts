import { Module } from '@nestjs/common';
import { FsbController } from './fsb.controller';
import { HistoryModule } from '../history/history.module';
import { AnonymizationModule } from '../anonymization/anonymization.module';
@Module({
  imports: [HistoryModule, AnonymizationModule],
  controllers: [FsbController],
})
export class FsbModule {}
