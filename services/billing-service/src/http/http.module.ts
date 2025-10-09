import { Module } from '@nestjs/common';
import { HttpController } from './http.controller';
import { SyncController } from './sync.controller';
import { BillingModule } from '../billing/billing.module';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [BillingModule, PrismaModule],
  controllers: [HttpController, SyncController],
})
export class BillingHttpModule {}
