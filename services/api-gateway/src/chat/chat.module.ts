import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { HistoryModule } from '../history/history.module';
import { AnonymizationModule } from '../anonymization/anonymization.module';
import { RabbitMQModule } from '../common/rabbitmq/rabbitmq.module';

@Module({
  imports: [ConfigModule, HttpModule, HistoryModule, AnonymizationModule, RabbitMQModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}

