import { AICertification, AICertificationLevel, AICertificationStatus } from '@ai-aggregator/shared';
import { CertificationService } from './certification.service';
export declare class CertificationController {
    private readonly certificationService;
    constructor(certificationService: CertificationService);
    submitCertificationRequest(request: any): Promise<import("./certification.service").CertificationResponse>;
    getCertificationLevels(): Promise<{
        levels: AICertificationLevel[];
    }>;
    getCertificationStatuses(): Promise<{
        statuses: AICertificationStatus[];
    }>;
    getModelCertification(modelId: string): Promise<AICertification>;
    getAllCertifications(status?: AICertificationStatus, level?: AICertificationLevel): Promise<{
        certifications: AICertification[];
    }>;
    revokeCertification(modelId: string, body: {
        reason: string;
    }): Promise<{
        success: boolean;
        message: string;
        modelId: string;
        reason: string;
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
    getModelCertificationById(modelId: string): Promise<AICertification>;
    getRequirements(): Promise<{
        general: {
            description: string;
            overview: string;
            categories: {
                name: string;
                description: string;
                requirements: string[];
            }[];
            process: string[];
            documentation: string[];
        };
    }>;
}
