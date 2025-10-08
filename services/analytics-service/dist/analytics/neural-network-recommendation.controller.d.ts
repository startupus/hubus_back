import { NeuralNetworkRecommendationService } from './neural-network-recommendation.service';
export declare class NeuralNetworkRecommendationController {
    private readonly recommendationService;
    constructor(recommendationService: NeuralNetworkRecommendationService);
    getRecommendations(req: any, limit?: number, includeRussian?: boolean): Promise<{
        success: boolean;
        data: import("./neural-network-recommendation.service").RecommendationResponse;
    }>;
    getPopular(limit?: number): Promise<{
        success: boolean;
        data: import("./neural-network-recommendation.service").NeuralNetworkStats[];
    }>;
    getProviderStats(req: any, provider: string): Promise<{
        success: boolean;
        data: import("./neural-network-recommendation.service").NeuralNetworkStats[];
    }>;
    getRussianDefaults(): Promise<{
        success: boolean;
        data: {
            provider: string;
            model: string;
            reason: string;
            score: number;
            description: string;
        }[];
    }>;
}
