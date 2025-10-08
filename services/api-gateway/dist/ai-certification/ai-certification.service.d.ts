import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AICertification, AICertificationLevel, AICertificationStatus } from '@ai-aggregator/shared';
export interface CertificationRequest {
    modelId: string;
    provider: string;
    modelName: string;
    requestedLevel: AICertificationLevel;
    testData?: any;
    metadata?: Record<string, any>;
}
export interface CertificationResponse {
    success: boolean;
    certification?: AICertification;
    errors?: string[];
    warnings?: string[];
    recommendations?: string[];
}
export declare class AICertificationService {
    private readonly httpService;
    private readonly configService;
    private readonly certificationServiceUrl;
    constructor(httpService: HttpService, configService: ConfigService);
    submitCertificationRequest(request: CertificationRequest): Promise<CertificationResponse>;
    getCertificationLevels(): Promise<{
        levels: AICertificationLevel[];
    }>;
    getCertificationStatuses(): Promise<{
        statuses: AICertificationStatus[];
    }>;
    getModelCertification(modelId: string): Promise<AICertification | null>;
    getAllCertifications(status?: AICertificationStatus, level?: AICertificationLevel): Promise<{
        certifications: AICertification[];
    }>;
    revokeCertification(modelId: string, reason: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getLevelRequirements(level: AICertificationLevel): Promise<{
        level: AICertificationLevel;
        requirements: {
            minScore: number;
            minPassRate: number;
            requiredTests: string[];
            complianceStandards: string[];
        };
    }>;
    getRequirements(): Promise<any>;
}
