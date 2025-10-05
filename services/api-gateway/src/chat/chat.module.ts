import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}

