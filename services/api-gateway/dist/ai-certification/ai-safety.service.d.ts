import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AISafetyLevel, AISafetyAssessment, SafetyIncident, RiskFactorCategory } from '@ai-aggregator/shared';
export interface SafetyTestRequest {
    modelId: string;
    testData?: any;
    testType: 'comprehensive' | 'quick' | 'targeted';
    focusAreas?: RiskFactorCategory[];
}
export interface SafetyTestResponse {
    success: boolean;
    assessment?: AISafetyAssessment;
    errors?: string[];
    warnings?: string[];
    recommendations?: string[];
}
export declare class AISafetyService {
    private readonly httpService;
    private readonly configService;
    private readonly safetyServiceUrl;
    constructor(httpService: HttpService, configService: ConfigService);
    conductSafetyAssessment(request: SafetyTestRequest): Promise<SafetyTestResponse>;
    getSafetyLevels(): Promise<{
        levels: AISafetyLevel[];
    }>;
    getRiskCategories(): Promise<{
        categories: RiskFactorCategory[];
    }>;
    getModelAssessment(modelId: string): Promise<AISafetyAssessment | null>;
    getModelIncidents(modelId: string, severity?: string): Promise<{
        incidents: SafetyIncident[];
    }>;
    reportIncident(incident: Omit<SafetyIncident, 'id'>): Promise<SafetyIncident>;
    getSafetyStatistics(modelId: string): Promise<{
        totalIncidents: number;
        criticalIncidents: number;
        resolvedIncidents: number;
        averageResolutionTime: number;
    }>;
    getSafetyLevelDescription(level: AISafetyLevel): Promise<{
        level: AISafetyLevel;
        description: string;
        requirements: string[];
        restrictions: string[];
    }>;
}
