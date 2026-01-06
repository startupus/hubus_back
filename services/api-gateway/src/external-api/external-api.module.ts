import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ExternalApiController } from './external-api.controller';
import { AudioController } from './audio.controller';
import { ChatModule } from '../chat/chat.module';
import { HistoryModule } from '../history/history.module';
import { AnonymizationModule } from '../anonymization/anonymization.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    ChatModule,
    HistoryModule,
    AnonymizationModule,
    AuthModule,
  ],
  controllers: [ExternalApiController, AudioController],
})
export class ExternalApiModule {}


