import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { PricingService } from './pricing.service';
import { PaymentGatewayService } from './payment-gateway.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { CacheService } from '../common/cache/cache.service';
import { ValidationService } from '../common/validation/validation.service';

@Module({
  imports: [PrismaModule],
  providers: [
    BillingService, 
    PricingService, 
    PaymentGatewayService,
    CacheService,
    ValidationService
  ],
  exports: [
    BillingService, 
    PricingService, 
    PaymentGatewayService,
    CacheService,
    ValidationService
  ],
})
export class BillingModule {}