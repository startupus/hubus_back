import { PaymentService } from '../payment/payment.service';
import { YooKassaService } from '../yookassa/yookassa.service';
export declare class WebhookController {
    private readonly paymentService;
    private readonly yooKassa;
    private readonly logger;
    constructor(paymentService: PaymentService, yooKassa: YooKassaService);
    handleYooKassaWebhook(body: any, headers: any): Promise<{
        status: string;
    }>;
    private verifySignature;
}
