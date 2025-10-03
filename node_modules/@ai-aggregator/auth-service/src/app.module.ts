import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ApiKeyModule } from './modules/api-key/api-key.module';
import { UserModule } from './modules/user/user.module';
import { SecurityModule } from './modules/security/security.module';
import { GrpcModule } from './grpc/grpc.module';
import { HealthModule } from './health/health.module';
import { configuration } from './config/configuration';
import { validationSchema } from './config/validation.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      envFilePath: ['.env.local', '.env'],
      ignoreEnvFile: false,
      expandVariables: true,
    }),
    PrismaModule,
    AuthModule,
    ApiKeyModule,
    UserModule,
    SecurityModule,
    GrpcModule,
    HealthModule,
  ],
})
export class AppModule {}
