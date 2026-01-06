import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { LoggerUtil } from '@ai-aggregator/shared';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security middleware
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());
  
  // Body parser для JSON - увеличиваем лимит до 50MB для base64 аудио/видео
  // Express body parser уже включен в NestJS по умолчанию через @nestjs/platform-express
  // Но нужно явно настроить лимит для больших запросов
  const jsonLimit = configService.get('BODY_SIZE_LIMIT', '50mb');
  app.use(require('express').json({ limit: jsonLimit }));
  app.use(require('express').urlencoded({ extended: true, limit: jsonLimit }));

  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', '*'),
    credentials: true,
  });

  // Middleware для обработки запросов с префиксом /v1/ (для прямых запросов от Loginus)
  // Убираем префикс /v1/ из пути, так как маршруты зарегистрированы без него
  // НЕ убираем /v1 для внешнего API (/api/v1/...)
  app.use((req, res, next) => {
    if (req.url.startsWith('/v1/') && !req.url.startsWith('/api/v1/')) {
      req.url = req.url.replace('/v1', '');
    }
    next();
  });

  // Global prefix removed - префикс v1 убран, все эндпоинты доступны напрямую
  // Nginx будет проксировать /v1/* на api-gateway, убирая префикс /v1/

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      disableErrorMessages: false,
    }),
  );

  // Swagger documentation
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('AI Aggregator API Gateway')
      .setDescription('API Gateway for AI Aggregator microservices')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = configService.get('PORT', 3000);
  const host = configService.get('HOST', '0.0.0.0');

  await app.listen(port, host);

  LoggerUtil.info(
    'api-gateway',
    `API Gateway is running on http://${host}:${port}`,
    { port, host, environment: configService.get('NODE_ENV') }
  );
}

bootstrap().catch((error) => {
  LoggerUtil.fatal('api-gateway', 'Failed to start API Gateway', error);
  process.exit(1);
});
