import { PrismaService } from '../common/prisma/prisma.service';
export interface NeuralNetworkStats {
    id: string;
    provider: string;
    model: string;
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    uniqueUsers: number;
    avgResponseTime: number;
    successRate: number;
    lastUsed: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface NeuralNetworkRecommendation {
    id: string;
    userId?: string;
    provider: string;
    model: string;
    reason: string;
    score: number;
    isDefault: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface RecommendationRequest {
    userId?: string;
    limit?: number;
    includeRussian?: boolean;
}
export interface RecommendationResponse {
    recommendations: Array<{
        provider: string;
        model: string;
        reason: string;
        score: number;
        isDefault: boolean;
        stats?: {
            totalRequests: number;
            avgResponseTime: number;
            successRate: number;
        };
    }>;
    total: number;
    hasRussianDefaults: boolean;
}
export declare class NeuralNetworkRecommendationService {
    private readonly prisma;
    private readonly logger;
    private readonly russianDefaults;
    constructor(prisma: PrismaService);
    updateNeuralNetworkStats(data: {
        provider: string;
        model: string;
        requests?: number;
        tokens?: number;
        cost?: number;
        responseTime?: number;
        success?: boolean;
        userId?: string;
    }): Promise<void>;
    getRecommendations(request?: RecommendationRequest): Promise<RecommendationResponse>;
    getTopPopular(limit?: number): Promise<NeuralNetworkStats[]>;
    getProviderStats(provider: string): Promise<NeuralNetworkStats[]>;
    createPersonalRecommendation(data: {
        userId: string;
        provider: string;
        model: string;
        reason: string;
        score: number;
    }): Promise<NeuralNetworkRecommendation>;
    initializeRussianDefaults(): Promise<void>;
    private calculateAverageResponseTime;
    private calculateSuccessRate;
    private updateUniqueUsersCount;
    private buildRecommendationsFromStats;
    private calculateRecommendationScore;
    private getRussianDefaults;
    private getRussianDefaultsResponse;
}
