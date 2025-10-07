import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { PricingService } from './pricing.service';
import { PaymentGatewayService } from './payment-gateway.service';
import { ProviderClassificationService } from './provider-classification.service';
import { CriticalOperationsService } from './critical-operations.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { CacheService } from '../common/cache/cache.service';
import { ValidationService } from '../common/validation/validation.service';
import { RabbitMQModule } from '../common/rabbitmq/rabbitmq.module';

@Module({
  imports: [PrismaModule, RabbitMQModule],
  providers: [
    BillingService, 
    PricingService, 
    PaymentGatewayService,
    ProviderClassificationService,
    CriticalOperationsService,
    CacheService,
    ValidationService
  ],
  exports: [
    BillingService, 
    PricingService, 
    PaymentGatewayService,
    ProviderClassificationService,
    CriticalOperationsService,
    CacheService,
    ValidationService
  ],
})
export class BillingModule {}