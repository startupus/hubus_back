import { ProxyService } from './proxy.service';
export declare class ProxyController {
    private readonly proxyService;
    constructor(proxyService: ProxyService);
    proxyOpenAI(requestData: any): Promise<any>;
    proxyOpenRouter(requestData: any): Promise<any>;
    validateRequest(requestData: any): Promise<any>;
}
