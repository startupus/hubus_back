import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApiKeysDemoController } from './api-keys-demo.controller';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ApiKeyAuthGuard } from '../auth/guards/api-key-auth.guard';
import { ApiKeyService } from '../api-key/api-key.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') || configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn') || configService.get<string>('JWT_EXPIRES_IN') || '24h',
          issuer: configService.get<string>('jwt.issuer') || configService.get<string>('JWT_ISSUER') || 'ai-aggregator',
          audience: configService.get<string>('jwt.audience') || configService.get<string>('JWT_AUDIENCE') || 'ai-aggregator-users',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ApiKeysDemoController],
  providers: [PrismaService, JwtAuthGuard, ApiKeyAuthGuard, ApiKeyService],
  exports: [ApiKeyAuthGuard, ApiKeyService]
})
export class ApiKeysModule {}
