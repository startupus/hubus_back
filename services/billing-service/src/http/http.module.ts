import { Module } from '@nestjs/common';
import { HttpController } from './http.controller';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [BillingModule],
  controllers: [HttpController],
})
export class HttpModule {}
