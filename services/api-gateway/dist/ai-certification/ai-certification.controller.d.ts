import { AICertification, AICertificationLevel, AICertificationStatus } from '@ai-aggregator/shared';
import { AICertificationService, CertificationRequest, CertificationResponse } from './ai-certification.service';
export declare class AICertificationController {
    private readonly certificationService;
    constructor(certificationService: AICertificationService);
    submitCertificationRequest(request: CertificationRequest): Promise<CertificationResponse>;
    getCertificationLevels(): Promise<{
        levels: AICertificationLevel[];
    }>;
    getCertificationStatuses(): Promise<{
        statuses: AICertificationStatus[];
    }>;
    getModelCertificationById(modelId: string): Promise<AICertification | null>;
    getAllCertifications(status?: AICertificationStatus, level?: AICertificationLevel): Promise<{
        certifications: AICertification[];
    }>;
    revokeCertification(modelId: string, body: {
        reason: string;
    }): Promise<{
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
