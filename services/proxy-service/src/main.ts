import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { LoggerUtil } from '@ai-aggregator/shared';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Body parser для JSON - увеличиваем лимит до 50MB для base64 аудио/видео
  const jsonLimit = configService.get('BODY_SIZE_LIMIT', '50mb');
  app.use(require('express').json({ limit: jsonLimit }));
  app.use(require('express').urlencoded({ extended: true, limit: jsonLimit }));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: false,
    }),
  );

  const port = configService.get('PROXY_SERVICE_PORT', 3003);
  const host = configService.get('HOST', '0.0.0.0');

  await app.listen(port, host);

  LoggerUtil.info(
    'proxy-service',
    `Proxy service is running on http://${host}:${port}`,
    {
      port,
      host,
      environment: configService.get('NODE_ENV')
    }
  );
}

bootstrap().catch((error) => {
  LoggerUtil.fatal('proxy-service', 'Failed to start Proxy service', error);
  process.exit(1);
});
