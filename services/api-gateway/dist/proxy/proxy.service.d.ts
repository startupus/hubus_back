import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
export declare class ProxyService {
    private readonly httpService;
    private readonly configService;
    private readonly proxyServiceUrl;
    constructor(httpService: HttpService, configService: ConfigService);
    proxyOpenAI(requestData: any): Promise<any>;
    proxyOpenRouter(requestData: any): Promise<any>;
    validateRequest(requestData: any): Promise<any>;
}
