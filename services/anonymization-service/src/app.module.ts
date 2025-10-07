import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnonymizationModule } from './anonymization/anonymization.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AnonymizationModule,
    HealthModule,
  ],
})
export class AppModule {}
