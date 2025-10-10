import { NestFactory } from '@nestjs/core';
import { RealisticAppModule } from './realistic-app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('PaymentService');
  
  try {
    const app = await NestFactory.create(RealisticAppModule);
    
    // Enable CORS
    app.enableCors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    });
    
    // Set global prefix
    app.setGlobalPrefix('api/v1');
    
    // Add request logging
    app.use((req, res, next) => {
      logger.log(`${req.method} ${req.url}`, 'HTTP');
      next();
    });
    
    const port = process.env.PORT || 3006;
    await app.listen(port);
    
    logger.log(`Payment service is running on port ${port}`);
    logger.log(`Health check: http://localhost:${port}/api/v1/health`);
    logger.log(`API docs: http://localhost:${port}/api/v1/payments`);
    
  } catch (error) {
    logger.error('Error starting payment service:', error);
    process.exit(1);
  }
}

bootstrap();
