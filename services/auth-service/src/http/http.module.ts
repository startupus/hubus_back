import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpController } from './http.controller';
import { EmployeeController } from './employee.controller';
import { AuthModule } from '../modules/auth/auth.module';
import { ApiKeyModule } from '../modules/api-key/api-key.module';
import { EmployeeModule } from '../modules/employee/employee.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    AuthModule, 
    ApiKeyModule, 
    EmployeeModule, 
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'your-secret-key'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [HttpController, EmployeeController],
})
export class AuthHttpModule {}
