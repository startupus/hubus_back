import { AICertification, AICertificationLevel, AICertificationStatus } from '../types/ai-certification';
import { AICertificationService, CertificationRequest, CertificationResponse } from '../services/ai-certification.service';
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
    getModelCertification(modelId: string): Promise<AICertification | null>;
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
    private getRequirementsForLevel;
}
//# sourceMappingURL=ai-certification.controller.d.ts.map