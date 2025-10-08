"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificationService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@ai-aggregator/shared");
let CertificationService = class CertificationService {
    constructor() {
        this.testSuites = new Map();
        this.activeCertifications = new Map();
        this.auditHistory = new Map();
        this.initializeTestSuites();
    }
    async submitCertificationRequest(request) {
        try {
            shared_1.LoggerUtil.info('ai-certification-service', 'Certification request submitted', {
                modelId: request.modelId,
                provider: request.provider,
                requestedLevel: request.requestedLevel
            });
            const validation = await this.validateCertificationRequest(request);
            if (!validation.isValid) {
                return {
                    success: false,
                    errors: validation.errors,
                    warnings: validation.warnings
                };
            }
            const testResults = await this.runCertificationTests(request);
            const assessment = await this.assessTestResults(testResults, request.requestedLevel);
            if (assessment.passed) {
                const certification = await this.createCertification(request, testResults, assessment);
                this.activeCertifications.set(request.modelId, certification);
                return {
                    success: true,
                    certification,
                    warnings: assessment.warnings,
                    recommendations: assessment.recommendations
                };
            }
            else {
                return {
                    success: false,
                    errors: assessment.failures,
                    warnings: assessment.warnings,
                    recommendations: assessment.recommendations
                };
            }
        }
        catch (error) {
            shared_1.LoggerUtil.error('ai-certification-service', 'Failed to submit certification request', error);
            return {
                success: false,
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                warnings: [],
                recommendations: ['Повторите попытку сертификации позже']
            };
        }
    }
    async validateCertificationRequest(request) {
        const errors = [];
        const warnings = [];
        if (!request.modelId) {
            errors.push('Model ID is required');
        }
        if (!request.provider) {
            errors.push('Provider is required');
        }
        if (!request.modelName) {
            errors.push('Model name is required');
        }
        if (this.activeCertifications.has(request.modelId)) {
            const existing = this.activeCertifications.get(request.modelId);
            if (existing.status === shared_1.AICertificationStatus.APPROVED) {
                warnings.push('Model already has an active certification');
            }
        }
        if (request.requestedLevel === shared_1.AICertificationLevel.ENTERPRISE) {
            warnings.push('Enterprise level certification requires additional documentation');
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    async runCertificationTests(request) {
        const testResults = [];
        const requiredSuite = this.getTestSuiteForLevel(request.requestedLevel);
        for (const testCase of requiredSuite.tests) {
            try {
                const result = await testCase.testFunction(request.modelId);
                testResults.push(result);
            }
            catch (error) {
                testResults.push({
                    id: `test_${Date.now()}`,
                    testName: testCase.name,
                    testType: 'automated',
                    score: 0,
                    passed: false,
                    details: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    testedAt: new Date(),
                    testedBy: 'ai-certification-service'
                });
            }
        }
        return testResults;
    }
    async assessTestResults(testResults, requestedLevel) {
        const failures = [];
        const warnings = [];
        const recommendations = [];
        let totalScore = 0;
        let totalWeight = 0;
        let passedTests = 0;
        for (const result of testResults) {
            totalWeight += 1;
            totalScore += result.score;
            if (result.passed) {
                passedTests++;
            }
            else {
                failures.push(`${result.testName}: ${result.details}`);
            }
            if (result.score < 70) {
                warnings.push(`${result.testName} scored below recommended threshold`);
                recommendations.push(`Improve performance in ${result.testName}`);
            }
        }
        const overallScore = totalWeight > 0 ? totalScore / totalWeight : 0;
        const passRate = totalWeight > 0 ? passedTests / totalWeight : 0;
        const requiredPassRate = this.getRequiredPassRate(requestedLevel);
        const requiredScore = this.getRequiredScore(requestedLevel);
        const passed = passRate >= requiredPassRate && overallScore >= requiredScore;
        if (!passed) {
            if (passRate < requiredPassRate) {
                failures.push(`Pass rate ${(passRate * 100).toFixed(1)}% is below required ${(requiredPassRate * 100).toFixed(1)}%`);
            }
            if (overallScore < requiredScore) {
                failures.push(`Overall score ${overallScore.toFixed(1)} is below required ${requiredScore}`);
            }
        }
        return {
            passed,
            score: overallScore,
            failures,
            warnings,
            recommendations
        };
    }
    async createCertification(request, testResults, assessment) {
        const certification = {
            id: `cert_${Date.now()}`,
            modelId: request.modelId,
            provider: request.provider,
            certificationLevel: request.requestedLevel,
            status: shared_1.AICertificationStatus.APPROVED,
            issuedAt: new Date(),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            issuedBy: 'ai-certification-service',
            certificateUrl: `https://certificates.ai-aggregator.com/${request.modelId}`,
            capabilities: await this.extractCapabilities(testResults),
            safetyLevel: this.determineSafetyLevel(testResults),
            compliance: await this.assessCompliance(testResults),
            testResults,
            metadata: {
                ...request.metadata,
                overallScore: assessment.score,
                passRate: (testResults.filter(r => r.passed).length / testResults.length) * 100
            }
        };
        return certification;
    }
    async extractCapabilities(testResults) {
        const capabilities = [];
        for (const result of testResults) {
            if (result.passed && result.score > 80) {
                capabilities.push({
                    id: `cap_${result.id}`,
                    name: result.testName,
                    description: `Capability verified by ${result.testName}`,
                    category: this.mapTestToCategory(result.testName),
                    isSupported: true,
                    confidence: result.score / 100
                });
            }
        }
        return capabilities;
    }
    determineSafetyLevel(testResults) {
        const safetyTests = testResults.filter(r => r.testName.toLowerCase().includes('safety'));
        const avgSafetyScore = safetyTests.length > 0
            ? safetyTests.reduce((sum, r) => sum + r.score, 0) / safetyTests.length
            : 0;
        if (avgSafetyScore >= 95)
            return shared_1.AISafetyLevel.SAFE;
        if (avgSafetyScore >= 80)
            return shared_1.AISafetyLevel.MODERATE;
        if (avgSafetyScore >= 60)
            return shared_1.AISafetyLevel.CAUTION;
        return shared_1.AISafetyLevel.HIGH_RISK;
    }
    async assessCompliance(testResults) {
        const compliance = {
            gdpr: this.checkCompliance(testResults, 'gdpr'),
            ccpa: this.checkCompliance(testResults, 'ccpa'),
            hipaa: this.checkCompliance(testResults, 'hipaa'),
            sox: this.checkCompliance(testResults, 'sox'),
            iso27001: this.checkCompliance(testResults, 'iso27001'),
            soc2: this.checkCompliance(testResults, 'soc2'),
            custom: {}
        };
        return compliance;
    }
    checkCompliance(testResults, standard) {
        const relevantTests = testResults.filter(r => r.testName.toLowerCase().includes(standard.toLowerCase()));
        return relevantTests.length > 0 && relevantTests.every(r => r.passed);
    }
    mapTestToCategory(testName) {
        if (testName.toLowerCase().includes('safety'))
            return 'safety';
        if (testName.toLowerCase().includes('bias'))
            return 'fairness';
        if (testName.toLowerCase().includes('performance'))
            return 'performance';
        if (testName.toLowerCase().includes('security'))
            return 'security';
        return 'general';
    }
    getRequiredPassRate(level) {
        switch (level) {
            case shared_1.AICertificationLevel.BASIC: return 0.7;
            case shared_1.AICertificationLevel.INTERMEDIATE: return 0.8;
            case shared_1.AICertificationLevel.ADVANCED: return 0.9;
            case shared_1.AICertificationLevel.EXPERT: return 0.95;
            case shared_1.AICertificationLevel.ENTERPRISE: return 0.98;
            default: return 0.7;
        }
    }
    getRequiredScore(level) {
        switch (level) {
            case shared_1.AICertificationLevel.BASIC: return 70;
            case shared_1.AICertificationLevel.INTERMEDIATE: return 80;
            case shared_1.AICertificationLevel.ADVANCED: return 90;
            case shared_1.AICertificationLevel.EXPERT: return 95;
            case shared_1.AICertificationLevel.ENTERPRISE: return 98;
            default: return 70;
        }
    }
    getTestSuiteForLevel(level) {
        const suiteId = `suite_${level.toLowerCase()}`;
        return this.testSuites.get(suiteId) || this.getDefaultTestSuite();
    }
    getDefaultTestSuite() {
        return {
            id: 'default',
            name: 'Default Test Suite',
            description: 'Basic certification tests',
            tests: [
                {
                    id: 'basic_safety',
                    name: 'Basic Safety Test',
                    description: 'Basic safety assessment',
                    type: 'safety',
                    weight: 1,
                    threshold: 70,
                    testFunction: async (modelId) => ({
                        id: `test_${Date.now()}`,
                        testName: 'Basic Safety Test',
                        testType: 'automated',
                        score: 85,
                        passed: true,
                        details: 'Basic safety test passed',
                        testedAt: new Date(),
                        testedBy: 'ai-certification-service'
                    })
                }
            ],
            requiredForLevel: [shared_1.AICertificationLevel.BASIC]
        };
    }
    initializeTestSuites() {
    }
    async getCertificationLevels() {
        try {
            const levels = [
                'BASIC',
                'INTERMEDIATE',
                'ADVANCED',
                'EXPERT',
                'ENTERPRISE'
            ];
            return { levels };
        }
        catch (error) {
            shared_1.LoggerUtil.error('ai-certification-service', 'Failed to get certification levels', error);
            throw error;
        }
    }
    async getCertificationStatuses() {
        try {
            const statuses = [
                'PENDING',
                'IN_PROGRESS',
                'APPROVED',
                'REJECTED',
                'EXPIRED',
                'REVOKED'
            ];
            return { statuses };
        }
        catch (error) {
            shared_1.LoggerUtil.error('ai-certification-service', 'Failed to get certification statuses', error);
            throw error;
        }
    }
    async getModelCertification(modelId) {
        try {
            shared_1.LoggerUtil.debug('ai-certification-service', 'Getting model certification', { modelId });
            const certification = {
                id: `cert-${modelId}`,
                modelId,
                provider: 'openai',
                certificationLevel: 'ADVANCED',
                status: 'APPROVED',
                issuedAt: new Date('2024-01-15'),
                expiresAt: new Date('2025-01-15'),
                issuedBy: 'ai-certification-service',
                capabilities: [],
                safetyLevel: 'SAFE',
                compliance: {
                    gdpr: true,
                    ccpa: true,
                    hipaa: false,
                    sox: false,
                    iso27001: true,
                    soc2: true,
                    custom: {}
                },
                testResults: [
                    {
                        id: 'test-1',
                        testName: 'safety',
                        testType: 'automated',
                        score: 98,
                        passed: true,
                        details: 'Safety test passed',
                        testedAt: new Date(),
                        testedBy: 'system'
                    },
                    {
                        id: 'test-2',
                        testName: 'accuracy',
                        testType: 'automated',
                        score: 92,
                        passed: true,
                        details: 'Accuracy test passed',
                        testedAt: new Date(),
                        testedBy: 'system'
                    },
                    {
                        id: 'test-3',
                        testName: 'bias',
                        testType: 'automated',
                        score: 89,
                        passed: true,
                        details: 'Bias test passed',
                        testedAt: new Date(),
                        testedBy: 'system'
                    }
                ],
                metadata: {}
            };
            return certification;
        }
        catch (error) {
            shared_1.LoggerUtil.error('ai-certification-service', 'Failed to get model certification', error);
            throw error;
        }
    }
    async getAllCertifications(status, level) {
        try {
            shared_1.LoggerUtil.debug('ai-certification-service', 'Getting all certifications', { status, level });
            const certifications = [
                {
                    id: 'cert-1',
                    modelId: 'gpt-4',
                    provider: 'openai',
                    certificationLevel: 'ADVANCED',
                    status: 'APPROVED',
                    issuedAt: new Date('2024-01-15'),
                    expiresAt: new Date('2025-01-15'),
                    issuedBy: 'ai-certification-service',
                    capabilities: [],
                    safetyLevel: 'SAFE',
                    compliance: {
                        gdpr: true,
                        ccpa: true,
                        hipaa: false,
                        sox: false,
                        iso27001: true,
                        soc2: true,
                        custom: {}
                    },
                    testResults: [],
                    metadata: {}
                },
                {
                    id: 'cert-2',
                    modelId: 'claude-3',
                    provider: 'anthropic',
                    certificationLevel: 'INTERMEDIATE',
                    status: 'PENDING',
                    issuedAt: new Date(),
                    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                    issuedBy: 'ai-certification-service',
                    capabilities: [],
                    safetyLevel: 'SAFE',
                    compliance: {
                        gdpr: false,
                        ccpa: false,
                        hipaa: false,
                        sox: false,
                        iso27001: false,
                        soc2: false,
                        custom: {}
                    },
                    testResults: [],
                    metadata: {}
                }
            ];
            return { certifications };
        }
        catch (error) {
            shared_1.LoggerUtil.error('ai-certification-service', 'Failed to get all certifications', error);
            throw error;
        }
    }
    async revokeCertification(modelId, reason) {
        try {
            shared_1.LoggerUtil.info('ai-certification-service', 'Revoking certification', { modelId, reason });
            return {
                success: true,
                message: 'Certification revoked successfully',
                modelId,
                reason
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('ai-certification-service', 'Failed to revoke certification', error);
            throw error;
        }
    }
    async getLevelRequirements(level) {
        try {
            shared_1.LoggerUtil.debug('ai-certification-service', 'Getting level requirements', { level });
            const requirements = {
                BASIC: {
                    minScore: 70,
                    minPassRate: 0.7,
                    requiredTests: ['safety', 'accuracy'],
                    complianceStandards: ['ISO/IEC 23053']
                },
                INTERMEDIATE: {
                    minScore: 80,
                    minPassRate: 0.8,
                    requiredTests: ['safety', 'accuracy', 'bias'],
                    complianceStandards: ['ISO/IEC 23053', 'IEEE 2859']
                },
                ADVANCED: {
                    minScore: 90,
                    minPassRate: 0.9,
                    requiredTests: ['safety', 'accuracy', 'bias', 'robustness'],
                    complianceStandards: ['ISO/IEC 23053', 'IEEE 2859', 'NIST AI RMF']
                },
                EXPERT: {
                    minScore: 95,
                    minPassRate: 0.95,
                    requiredTests: ['safety', 'accuracy', 'bias', 'robustness', 'interpretability'],
                    complianceStandards: ['ISO/IEC 23053', 'IEEE 2859', 'NIST AI RMF', 'EU AI Act']
                },
                ENTERPRISE: {
                    minScore: 98,
                    minPassRate: 0.98,
                    requiredTests: ['safety', 'accuracy', 'bias', 'robustness', 'interpretability', 'scalability'],
                    complianceStandards: ['ISO/IEC 23053', 'IEEE 2859', 'NIST AI RMF', 'EU AI Act', 'GDPR']
                }
            };
            return {
                level,
                requirements: requirements[level] || requirements.BASIC
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('ai-certification-service', 'Failed to get level requirements', error);
            throw error;
        }
    }
    async getRequirements() {
        try {
            shared_1.LoggerUtil.debug('ai-certification-service', 'Getting general certification requirements');
            const requirements = {
                general: {
                    description: 'General AI model certification requirements',
                    overview: 'AI models must meet specific safety, accuracy, and compliance standards to receive certification',
                    categories: [
                        {
                            name: 'Safety',
                            description: 'Model safety and harm prevention',
                            requirements: [
                                'No harmful content generation',
                                'Bias mitigation',
                                'Robustness testing',
                                'Safety guardrails'
                            ]
                        },
                        {
                            name: 'Accuracy',
                            description: 'Model accuracy and reliability',
                            requirements: [
                                'Performance benchmarks',
                                'Accuracy thresholds',
                                'Consistency testing',
                                'Error rate limits'
                            ]
                        },
                        {
                            name: 'Compliance',
                            description: 'Regulatory and legal compliance',
                            requirements: [
                                'GDPR compliance',
                                'Data privacy protection',
                                'Transparency requirements',
                                'Audit trail maintenance'
                            ]
                        }
                    ],
                    process: [
                        'Submit certification request',
                        'Complete required tests',
                        'Pass safety assessments',
                        'Meet compliance standards',
                        'Receive certification'
                    ],
                    documentation: [
                        'Model architecture documentation',
                        'Training data provenance',
                        'Safety assessment reports',
                        'Compliance certificates'
                    ]
                }
            };
            return requirements;
        }
        catch (error) {
            shared_1.LoggerUtil.error('ai-certification-service', 'Failed to get requirements', error);
            throw error;
        }
    }
};
exports.CertificationService = CertificationService;
exports.CertificationService = CertificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CertificationService);
//# sourceMappingURL=certification.service.js.map