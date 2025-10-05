import { Request } from 'express';
import { ApiKeyService } from './api-key.service';
import { CreateApiKeyDto, UpdateApiKeyDto } from '@ai-aggregator/shared';
export declare class ApiKeyController {
    private readonly apiKeyService;
    constructor(apiKeyService: ApiKeyService);
    createApiKey(createApiKeyDto: CreateApiKeyDto, req: Request): Promise<ApiKey>;
    listApiKeys(page: number, limit: number, req: Request): Promise<{
        apiKeys: CreateApiKeyDto[];
        total: number;
    }>;
    getApiKeyById(id: string, req: Request): Promise<ApiKey>;
    updateApiKey(id: string, updateApiKeyDto: UpdateApiKeyDto, req: Request): Promise<ApiKey>;
    revokeApiKey(id: string, req: Request): Promise<void>;
}
