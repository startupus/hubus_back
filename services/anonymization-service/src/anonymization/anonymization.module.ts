import { Module } from '@nestjs/common';
import { AnonymizationController } from './anonymization.controller';
import { AnonymizationService } from './anonymization.service';

@Module({
  controllers: [AnonymizationController],
  providers: [AnonymizationService],
  exports: [AnonymizationService],
})
export class AnonymizationModule {}
