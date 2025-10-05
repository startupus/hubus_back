import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule as AxiosHttpModule } from '@nestjs/axios';
import { validationSchema } from './config/validation.schema';
import configuration from './config/configuration';
import { OrchestratorModule } from './orchestrator/orchestrator.module';
import { HttpModule } from './http/http.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      envFilePath: ['.env.local', '.env'],
      expandVariables: true,
    }),
    AxiosHttpModule,
    OrchestratorModule,
    HttpModule,
    HealthModule,
  ],
})
export class AppModule {}
