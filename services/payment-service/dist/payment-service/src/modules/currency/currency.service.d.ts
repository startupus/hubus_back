import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
export declare class CurrencyService {
    private readonly configService;
    private readonly httpService;
    private readonly logger;
    constructor(configService: ConfigService, httpService: HttpService);
    getUsdToRubRate(): Promise<number>;
    convertRubToUsd(rubAmount: number): Promise<number>;
    convertUsdToRub(usdAmount: number): Promise<number>;
}
