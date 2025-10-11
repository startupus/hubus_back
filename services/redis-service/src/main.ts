import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    app.enableCors();
    
    const port = process.env.PORT || 3009;
    await app.listen(port);
    
    console.log(`Redis Service is running on port ${port}`);
  } catch (error) {
    console.error('Failed to start Redis Service:', error);
    process.exit(1);
  }
}

bootstrap();
