import { BillingService } from './billing.service';
import { UserBalanceDto } from '@ai-aggregator/shared';
export declare class BillingController {
    private readonly billingService;
    constructor(billingService: BillingService);
    getBalance(): Promise<UserBalanceDto>;
}
