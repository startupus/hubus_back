import { Module } from '@nestjs/common';
import { PaymentValidationService } from './payment-validation.service';

@Module({
  providers: [PaymentValidationService],
  exports: [PaymentValidationService],
})
export class SecurityModule {}
