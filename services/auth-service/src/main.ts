import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
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

  // gRPC microservice
  const grpcOptions: MicroserviceOptions = {
    transport: Transport.GRPC,
    options: {
      package: 'auth',
      protoPath: join(__dirname, '../proto/auth.proto'),
      url: `0.0.0.0:${configService.get('AUTH_GRPC_PORT', 50051)}`,
    },
  };

  app.connectMicroservice<MicroserviceOptions>(grpcOptions);

  const port = configService.get('AUTH_SERVICE_PORT', 3001);
  const host = configService.get('HOST', '0.0.0.0');

  await app.startAllMicroservices();
  await app.listen(port, host);

  LoggerUtil.info(
    'auth-service',
    `Auth service is running on http://${host}:${port} and gRPC on port ${configService.get('AUTH_GRPC_PORT', 50051)}`,
    { 
      port, 
      host, 
      grpcPort: configService.get('AUTH_GRPC_PORT', 50051),
      environment: configService.get('NODE_ENV') 
    }
  );
}

bootstrap().catch((error) => {
  LoggerUtil.fatal('auth-service', 'Failed to start Auth service', error);
  process.exit(1);
});
