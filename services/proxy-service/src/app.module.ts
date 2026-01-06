import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { validationSchema } from './config/validation.schema';
import configuration from './config/configuration';
import { ProxyModule } from './proxy/proxy.module';
import { ProxyHttpModule } from './http/http.module';
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
    HttpModule.register({
      timeout: 600000, // 10 минут для длинных генераций
      maxRedirects: 3,
    }),
    ProxyModule,
    ProxyHttpModule,
    HealthModule,
  ],
})
export class AppModule {}
