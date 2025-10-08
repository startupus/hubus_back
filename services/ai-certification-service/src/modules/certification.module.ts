import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CertificationController } from './certification.controller';
import { CertificationService } from './certification.service';

@Module({
  imports: [HttpModule],
  controllers: [CertificationController],
  providers: [CertificationService],
  exports: [CertificationService],
})
export class CertificationModule {}
