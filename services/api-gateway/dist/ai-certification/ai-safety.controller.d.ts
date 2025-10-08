import { AISafetyLevel, AISafetyAssessment, SafetyIncident, RiskFactorCategory } from '@ai-aggregator/shared';
import { AISafetyService, SafetyTestRequest, SafetyTestResponse } from './ai-safety.service';
export declare class AISafetyController {
    private readonly safetyService;
    constructor(safetyService: AISafetyService);
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
