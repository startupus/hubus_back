import { Controller } from '@nestjs/common';
import { Logger } from '@nestjs/common';

@Controller()
export class OrchestratorGrpcController {
  private readonly logger = new Logger(OrchestratorGrpcController.name);

  constructor() {
    this.logger.log('OrchestratorGrpcController initialized');
  }
}

