import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { LoggerUtil } from '@ai-aggregator/shared';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: false,
    }),
  );

  const port = configService.get('ANALYTICS_SERVICE_PORT', 3005);
  const host = configService.get('HOST', '0.0.0.0');

  await app.listen(port, host);

  LoggerUtil.info(
    'analytics-service',
    `Analytics service is running on http://${host}:${port}`,
    {
      port,
      host,
      environment: configService.get('NODE_ENV')
    }
  );
}

bootstrap().catch((error) => {
  LoggerUtil.fatal('analytics-service', 'Failed to start Analytics service', error);
  process.exit(1);
});
