import { AISafetyLevel, AISafetyAssessment, SafetyIncident, RiskFactorCategory } from '../types/ai-certification';
import { AISafetyService, SafetyTestRequest, SafetyTestResponse } from '../services/ai-safety.service';
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
    reportIncident(incident: Omit<SafetyIncident, 'id'> & {
        modelId: string;
    }): Promise<SafetyIncident>;
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
    private getSafetyLevelInfo;
}
//# sourceMappingURL=ai-safety.controller.d.ts.map