import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
export declare class OrchestratorService {
    private readonly httpService;
    private readonly configService;
    private readonly orchestratorServiceUrl;
    constructor(httpService: HttpService, configService: ConfigService);
    getModels(): Promise<any>;
    routeRequest(requestData: any): Promise<any>;
}
