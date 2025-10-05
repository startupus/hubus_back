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

  const port = configService.get('AUTH_SERVICE_PORT', 3001);
  const host = configService.get('HOST', '0.0.0.0');

  await app.listen(port, host);

  LoggerUtil.info(
    'auth-service',
    `Auth service is running on http://${host}:${port}`,
    { 
      port, 
      host, 
      environment: configService.get('NODE_ENV') 
    }
  );
}

bootstrap().catch((error) => {
  LoggerUtil.fatal('auth-service', 'Failed to start Auth service', error);
  process.exit(1);
});
