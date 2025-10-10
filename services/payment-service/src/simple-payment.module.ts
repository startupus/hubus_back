import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SimplePaymentService } from './simple-payment.service';
import { SimplePaymentController } from './simple-payment.controller';
import { JwtAuthGuard } from './simple-jwt-auth.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-super-secret-jwt-key-here',
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [SimplePaymentController],
  providers: [SimplePaymentService, JwtAuthGuard],
  exports: [SimplePaymentService],
})
export class SimplePaymentModule {}
