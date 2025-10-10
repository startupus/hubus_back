import { ConfigService } from '@nestjs/config';
export declare class YooKassaService {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    createPayment(data: {
        amount: number;
        returnUrl: string;
        companyId: string;
    }): Promise<{
        id: string;
        status: string;
        confirmationUrl: string;
        amount: string;
        currency: string;
    }>;
    processWebhook(webhookData: any): Promise<{
        success: boolean;
        paymentId: any;
        status: string;
        amount: any;
        currency: any;
    }>;
}
