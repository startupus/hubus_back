import { AICategory, AICertificationLevel, AISafetyLevel, RiskFactorCategory } from '../types/ai-certification';
export declare class AIClassificationRequestDto {
    modelId: string;
    provider: string;
    modelName: string;
    description?: string;
    capabilities?: string[];
    testData?: any;
    metadata?: Record<string, any>;
}
export declare class AIClassificationResponseDto {
    success: boolean;
    classification?: any;
    errors?: string[];
    warnings?: string[];
    recommendations?: string[];
}
export declare class CertificationRequestDto {
    modelId: string;
    provider: string;
    modelName: string;
    requestedLevel: AICertificationLevel;
    testData?: any;
    metadata?: Record<string, any>;
}
export declare class CertificationResponseDto {
    success: boolean;
    certification?: any;
    errors?: string[];
    warnings?: string[];
    recommendations?: string[];
}
export declare class SafetyTestRequestDto {
    modelId: string;
    testType: 'comprehensive' | 'quick' | 'targeted';
    testData?: any;
    focusAreas?: RiskFactorCategory[];
}
export declare class SafetyTestResponseDto {
    success: boolean;
    assessment?: any;
    errors?: string[];
    warnings?: string[];
    recommendations?: string[];
}
export declare class SafetyIncidentDto {
    modelId: string;
    incidentType: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    occurredAt: string;
    resolution?: string;
    reportedBy: string;
    affectedUsers: number;
}
export declare class RevokeCertificationDto {
    reason: string;
}
export declare class CategoryInfoDto {
    category: AICategory;
    description: string;
    useCases: string[];
}
export declare class CertificationLevelInfoDto {
    level: AICertificationLevel;
    minScore: number;
    minPassRate: number;
    requiredTests: string[];
    complianceStandards: string[];
}
export declare class SafetyLevelInfoDto {
    level: AISafetyLevel;
    description: string;
    requirements: string[];
    restrictions: string[];
}
export declare class SafetyStatisticsDto {
    totalIncidents: number;
    criticalIncidents: number;
    resolvedIncidents: number;
    averageResolutionTime: number;
}
