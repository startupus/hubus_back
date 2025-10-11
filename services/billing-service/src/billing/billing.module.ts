import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PricingService } from './pricing.service';
import { PaymentGatewayService } from './payment-gateway.service';
import { ProviderClassificationService } from './provider-classification.service';
import { CriticalOperationsService } from './critical-operations.service';
import { ReferralService } from './referral.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { CacheService } from '../common/cache/cache.service';
import { RedisCacheService } from '../common/cache/redis-cache.service';
import { ConnectionPoolService } from '../common/database/connection-pool.service';
import { ValidationService } from '../common/validation/validation.service';
import { RabbitMQModule } from '../common/rabbitmq/rabbitmq.module';

@Module({
  imports: [PrismaModule, RabbitMQModule],
  controllers: [BillingController],
  providers: [
    BillingService, 
    PricingService, 
    PaymentGatewayService,
    ProviderClassificationService,
    CriticalOperationsService,
    ReferralService,
    CacheService,
    RedisCacheService,
    ConnectionPoolService,
    ValidationService
  ],
  exports: [
    BillingService, 
    PricingService, 
    PaymentGatewayService,
    ProviderClassificationService,
    CriticalOperationsService,
    ReferralService,
    CacheService,
    RedisCacheService,
    ConnectionPoolService,
    ValidationService
  ],
})
export class BillingModule {}