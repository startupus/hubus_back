import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { LoggerUtil } from '@ai-aggregator/shared';

async function bootstrap() {
  try {
    console.log('Payment Service: Starting bootstrap...');
    const app = await NestFactory.create(AppModule);
    console.log('Payment Service: App created successfully');
    
    // Enable CORS
    app.enableCors();
    console.log('Payment Service: CORS enabled');
    
    // Set global prefix (exclude health endpoints)
    app.setGlobalPrefix('api/v1', {
      exclude: ['health', 'health/ready', 'health/live', '/health', '/health/ready', '/health/live']
    });
    console.log('Payment Service: Global prefix set to v1');
    
    // Global validation pipe
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }));
    console.log('Payment Service: Validation pipe configured');

    // Swagger documentation
    const config = new DocumentBuilder()
      .setTitle('Payment Service API')
      .setDescription('API for payment processing with YooKassa integration')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
    console.log('Payment Service: Swagger configured');

    const port = process.env.HTTP_PORT || 3006;
    await app.listen(port);
    console.log(`Payment Service: Listening on port ${port}`);
    
    LoggerUtil.info('payment-service', `Payment service started on port ${port}`);
  } catch (error) {
    console.error('Payment Service: Bootstrap error:', error);
    LoggerUtil.error('payment-service', 'Failed to start payment service', error as Error);
    process.exit(1);
  }
}

bootstrap();
