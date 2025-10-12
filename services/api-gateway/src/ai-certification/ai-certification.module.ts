import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AIClassificationController } from './ai-classification.controller';
import { AICertificationController } from './ai-certification.controller';
import { AISafetyController } from './ai-safety.controller';
import { AIClassificationService } from './ai-classification.service';
import { AICertificationService } from './ai-certification.service';
import { AISafetyService } from './ai-safety.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [HttpModule, AuthModule],
  controllers: [
    AIClassificationController,
    AICertificationController,
    AISafetyController,
  ],
  providers: [
    AIClassificationService,
    AICertificationService,
    AISafetyService,
  ],
  exports: [
    AIClassificationService,
    AICertificationService,
    AISafetyService,
  ],
})
export class AICertificationModule {}
