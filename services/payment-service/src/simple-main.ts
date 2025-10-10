import { NestFactory } from '@nestjs/core';
import { SimpleAppModule } from './simple-app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(SimpleAppModule);
    
    // Enable CORS
    app.enableCors();
    
    // Set global prefix
    app.setGlobalPrefix('api/v1');
    
    await app.listen(3006);
    console.log('Payment service is running on port 3006');
  } catch (error) {
    console.error('Error starting payment service:', error);
    process.exit(1);
  }
}

bootstrap();