import { Module } from '@nestjs/common';
import { RabbitMQClient } from '@ai-aggregator/shared';

@Module({
  providers: [RabbitMQClient],
  exports: [RabbitMQClient],
})
export class RabbitMQModule {}
