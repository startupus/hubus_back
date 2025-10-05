import { Controller } from '@nestjs/common';
import { Logger } from '@nestjs/common';

@Controller()
export class ProxyGrpcController {
  private readonly logger = new Logger(ProxyGrpcController.name);

  constructor() {
    this.logger.log('ProxyGrpcController initialized');
  }
}

