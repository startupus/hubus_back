import { Module } from '@nestjs/common';
import { BalanceSecurityService } from './balance-security.service';

@Module({
  providers: [BalanceSecurityService],
  exports: [BalanceSecurityService],
})
export class SecurityModule {}
