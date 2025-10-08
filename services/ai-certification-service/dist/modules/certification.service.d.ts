import { AICertification, AICertificationLevel, AICertificationStatus, TestResult } from '@ai-aggregator/shared';
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
export interface TestSuite {
    id: string;
    name: string;
    description: string;
    tests: TestCase[];
    requiredForLevel: AICertificationLevel[];
}
export interface TestCase {
    id: string;
    name: string;
    description: string;
    type: 'performance' | 'safety' | 'bias' | 'compliance' | 'security';
    weight: number;
    threshold: number;
    testFunction: (modelId: string) => Promise<TestResult>;
}
export declare class CertificationService {
    private readonly testSuites;
    private readonly activeCertifications;
    private readonly auditHistory;
    constructor();
    submitCertificationRequest(request: CertificationRequest): Promise<CertificationResponse>;
    private validateCertificationRequest;
    private runCertificationTests;
    private assessTestResults;
    private createCertification;
    private extractCapabilities;
    private determineSafetyLevel;
    private assessCompliance;
    private checkCompliance;
    private mapTestToCategory;
    private getRequiredPassRate;
    private getRequiredScore;
    private getTestSuiteForLevel;
    private getDefaultTestSuite;
    private initializeTestSuites;
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
    revokeCertification(modelId: string, reason: string): Promise<{
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
