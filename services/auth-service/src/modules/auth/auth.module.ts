import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [
    PassportModule,
    PrismaModule,
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 3,
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN'),
          issuer: configService.get<string>('JWT_ISSUER'),
          audience: configService.get<string>('JWT_AUDIENCE'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, CompanyService, JwtStrategy, LocalStrategy],
  controllers: [AuthController, CompanyController],
  exports: [AuthService, CompanyService],
})
export class AuthModule {}
