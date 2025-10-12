import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // CORS
  app.enableCors();

  const port = process.env.PORT || 3008;
  await app.listen(port);
  
  console.log(`🚀 Anonymization Service running on port ${port}`);
}

bootstrap();
