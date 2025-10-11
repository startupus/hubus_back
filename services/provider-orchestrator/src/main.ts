import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        disableErrorMessages: false,
      }),
    );

    const port = process.env.HTTP_PORT || 3002;
    const host = process.env.HOST || '0.0.0.0';

    await app.listen(port, host);

    console.log(`Provider Orchestrator service is running on http://${host}:${port}`);
  } catch (error) {
    console.error('Failed to start Provider Orchestrator service:', error);
    process.exit(1);
  }
}

bootstrap();
