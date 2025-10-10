import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { RealisticPaymentService } from './realistic-payment.service';
import { RealisticPaymentController } from './realistic-payment.controller';
import { RealisticYooKassaService } from '../yookassa/realistic-yookassa.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-super-secret-jwt-key-here',
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [RealisticPaymentController],
  providers: [
    RealisticPaymentService,
    RealisticYooKassaService,
    JwtAuthGuard
  ],
  exports: [RealisticPaymentService, RealisticYooKassaService],
})
export class RealisticPaymentModule {}
