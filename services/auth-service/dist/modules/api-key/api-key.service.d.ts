import { PrismaService } from '../../common/prisma/prisma.service';
import { ApiKey, Permission } from '@ai-aggregator/shared';
import { CreateApiKeyDto, UpdateApiKeyDto } from '@ai-aggregator/shared';
export declare class ApiKeyService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createApiKey(userId: string, createApiKeyDto: CreateApiKeyDto): Promise<ApiKey>;
    getApiKeyById(apiKeyId: string, userId: string): Promise<ApiKey>;
    getApiKeyByKey(key: string): Promise<ApiKey>;
    listApiKeys(userId: string, page?: number, limit?: number): Promise<{
        apiKeys: ApiKey[];
        total: number;
    }>;
    updateApiKey(apiKeyId: string, userId: string, updateApiKeyDto: UpdateApiKeyDto): Promise<ApiKey>;
    revokeApiKey(apiKeyId: string, userId: string): Promise<void>;
    validateApiKey(key: string): Promise<{
        isValid: boolean;
        userId?: string;
        permissions?: Permission[];
    }>;
    private mapApiKeyToDto;
    private logSecurityEvent;
}
