import { Request } from 'express';
import { ApiKeyService } from './api-key.service';
import { CreateApiKeyDto, UpdateApiKeyDto } from '@ai-aggregator/shared';
export declare class ApiKeyController {
    private readonly apiKeyService;
    constructor(apiKeyService: ApiKeyService);
    createApiKey(createApiKeyDto: CreateApiKeyDto, req: Request): Promise<import("@ai-aggregator/shared").ApiKey>;
    listApiKeys(page: number, limit: number, req: Request): Promise<{
        apiKeys: import("@ai-aggregator/shared").ApiKey[];
        total: number;
    }>;
    getApiKeyById(id: string, req: Request): Promise<import("@ai-aggregator/shared").ApiKey>;
    updateApiKey(id: string, updateApiKeyDto: UpdateApiKeyDto, req: Request): Promise<import("@ai-aggregator/shared").ApiKey>;
    revokeApiKey(id: string, req: Request): Promise<void>;
}
