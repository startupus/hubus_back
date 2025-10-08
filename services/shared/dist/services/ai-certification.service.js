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
exports.AICertificationService = void 0;
const common_1 = require("@nestjs/common");
const ai_certification_1 = require("../types/ai-certification");
let AICertificationService = class AICertificationService {
    testSuites = new Map();
    activeCertifications = new Map();
    auditHistory = new Map();
    constructor() {
        this.initializeTestSuites();
    }
    /**
     * Подача заявки на сертификацию
     */
    async submitCertificationRequest(request) {
        try {
            // 1. Валидация заявки
            const validation = await this.validateCertificationRequest(request);
            if (!validation.isValid) {
                return {
                    success: false,
                    errors: validation.errors,
                    warnings: validation.warnings
                };
            }
            // 2. Запуск тестов
            const testResults = await this.runCertificationTests(request);
            // 3. Оценка результатов
            const assessment = await this.assessTestResults(testResults, request.requestedLevel);
            // 4. Создание сертификата (если тесты пройдены)
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
            return {
                success: false,
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                warnings: [],
                recommendations: ['Повторите попытку сертификации позже']
            };
        }
    }
    /**
     * Валидация заявки на сертификацию
     */
    async validateCertificationRequest(request) {
        const errors = [];
        const warnings = [];
        // Проверка обязательных полей
        if (!request.modelId) {
            errors.push('Model ID is required');
        }
        if (!request.provider) {
            errors.push('Provider is required');
        }
        if (!request.modelName) {
            errors.push('Model name is required');
        }
        // Проверка на дублирование
        if (this.activeCertifications.has(request.modelId)) {
            const existing = this.activeCertifications.get(request.modelId);
            if (existing.status === ai_certification_1.AICertificationStatus.APPROVED) {
                warnings.push('Model already has an active certification');
            }
        }
        // Проверка уровня сертификации
        if (request.requestedLevel === ai_certification_1.AICertificationLevel.GOVERNMENT) {
            warnings.push('Government level certification requires additional documentation');
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * Запуск тестов сертификации
     */
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
    /**
     * Оценка результатов тестирования
     */
    async assessTestResults(testResults, requestedLevel) {
        const failures = [];
        const warnings = [];
        const recommendations = [];
        let totalScore = 0;
        let totalWeight = 0;
        let passedTests = 0;
        for (const result of testResults) {
            totalWeight += 1; // Упрощенная схема весов
            totalScore += result.score;
            if (result.passed) {
                passedTests++;
            }
            else {
                failures.push(`${result.testName}: ${result.details}`);
            }
            // Генерация предупреждений и рекомендаций
            if (result.score < 70) {
                warnings.push(`${result.testName} scored below recommended threshold`);
                recommendations.push(`Improve performance in ${result.testName}`);
            }
        }
        const overallScore = totalWeight > 0 ? totalScore / totalWeight : 0;
        const passRate = totalWeight > 0 ? passedTests / totalWeight : 0;
        // Определение требований для прохождения
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
    /**
     * Создание сертификата
     */
    async createCertification(request, testResults, assessment) {
        const certification = {
            id: `cert_${Date.now()}`,
            modelId: request.modelId,
            provider: request.provider,
            certificationLevel: request.requestedLevel,
            status: ai_certification_1.AICertificationStatus.APPROVED,
            issuedAt: new Date(),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 год
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
    /**
     * Извлечение возможностей из результатов тестов
     */
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
    /**
     * Определение уровня безопасности
     */
    determineSafetyLevel(testResults) {
        const safetyTests = testResults.filter(r => r.testName.toLowerCase().includes('safety'));
        const avgSafetyScore = safetyTests.length > 0
            ? safetyTests.reduce((sum, t) => sum + t.score, 0) / safetyTests.length
            : 0;
        if (avgSafetyScore >= 90)
            return ai_certification_1.AISafetyLevel.SAFE;
        if (avgSafetyScore >= 70)
            return ai_certification_1.AISafetyLevel.CAUTION;
        if (avgSafetyScore >= 50)
            return ai_certification_1.AISafetyLevel.WARNING;
        if (avgSafetyScore >= 30)
            return ai_certification_1.AISafetyLevel.DANGEROUS;
        return ai_certification_1.AISafetyLevel.RESTRICTED;
    }
    /**
     * Оценка соответствия стандартам
     */
    async assessCompliance(testResults) {
        const complianceTests = testResults.filter(r => r.testName.toLowerCase().includes('compliance'));
        return {
            gdpr: this.checkComplianceTest(complianceTests, 'gdpr'),
            ccpa: this.checkComplianceTest(complianceTests, 'ccpa'),
            hipaa: this.checkComplianceTest(complianceTests, 'hipaa'),
            sox: this.checkComplianceTest(complianceTests, 'sox'),
            iso27001: this.checkComplianceTest(complianceTests, 'iso27001'),
            soc2: this.checkComplianceTest(complianceTests, 'soc2'),
            custom: {}
        };
    }
    /**
     * Проверка конкретного теста соответствия
     */
    checkComplianceTest(tests, standard) {
        const test = tests.find(t => t.testName.toLowerCase().includes(standard));
        return test ? test.passed && test.score >= 80 : false;
    }
    /**
     * Получение набора тестов для уровня сертификации
     */
    getTestSuiteForLevel(level) {
        const suiteId = this.getSuiteIdForLevel(level);
        return this.testSuites.get(suiteId) || this.testSuites.get('basic');
    }
    /**
     * Получение ID набора тестов для уровня
     */
    getSuiteIdForLevel(level) {
        switch (level) {
            case ai_certification_1.AICertificationLevel.BASIC:
                return 'basic';
            case ai_certification_1.AICertificationLevel.STANDARD:
                return 'standard';
            case ai_certification_1.AICertificationLevel.PREMIUM:
                return 'premium';
            case ai_certification_1.AICertificationLevel.ENTERPRISE:
                return 'enterprise';
            case ai_certification_1.AICertificationLevel.GOVERNMENT:
                return 'government';
            default:
                return 'basic';
        }
    }
    /**
     * Получение требуемого процента прохождения для уровня
     */
    getRequiredPassRate(level) {
        switch (level) {
            case ai_certification_1.AICertificationLevel.BASIC:
                return 0.7; // 70%
            case ai_certification_1.AICertificationLevel.STANDARD:
                return 0.8; // 80%
            case ai_certification_1.AICertificationLevel.PREMIUM:
                return 0.85; // 85%
            case ai_certification_1.AICertificationLevel.ENTERPRISE:
                return 0.9; // 90%
            case ai_certification_1.AICertificationLevel.GOVERNMENT:
                return 0.95; // 95%
            default:
                return 0.7;
        }
    }
    /**
     * Получение требуемого балла для уровня
     */
    getRequiredScore(level) {
        switch (level) {
            case ai_certification_1.AICertificationLevel.BASIC:
                return 70;
            case ai_certification_1.AICertificationLevel.STANDARD:
                return 80;
            case ai_certification_1.AICertificationLevel.PREMIUM:
                return 85;
            case ai_certification_1.AICertificationLevel.ENTERPRISE:
                return 90;
            case ai_certification_1.AICertificationLevel.GOVERNMENT:
                return 95;
            default:
                return 70;
        }
    }
    /**
     * Инициализация наборов тестов
     */
    initializeTestSuites() {
        // Базовый набор тестов
        this.testSuites.set('basic', {
            id: 'basic',
            name: 'Basic Certification Tests',
            description: 'Basic tests for AI model certification',
            requiredForLevel: [ai_certification_1.AICertificationLevel.BASIC],
            tests: [
                {
                    id: 'performance_basic',
                    name: 'Basic Performance Test',
                    description: 'Tests basic performance metrics',
                    type: 'performance',
                    weight: 1,
                    threshold: 70,
                    testFunction: async (modelId) => this.runPerformanceTest(modelId)
                },
                {
                    id: 'safety_basic',
                    name: 'Basic Safety Test',
                    description: 'Tests basic safety requirements',
                    type: 'safety',
                    weight: 1,
                    threshold: 80,
                    testFunction: async (modelId) => this.runSafetyTest(modelId)
                }
            ]
        });
        // Стандартный набор тестов
        this.testSuites.set('standard', {
            id: 'standard',
            name: 'Standard Certification Tests',
            description: 'Standard tests for AI model certification',
            requiredForLevel: [ai_certification_1.AICertificationLevel.STANDARD],
            tests: [
                ...this.testSuites.get('basic').tests,
                {
                    id: 'bias_test',
                    name: 'Bias Detection Test',
                    description: 'Tests for bias in model outputs',
                    type: 'bias',
                    weight: 1,
                    threshold: 75,
                    testFunction: async (modelId) => this.runBiasTest(modelId)
                },
                {
                    id: 'compliance_gdpr',
                    name: 'GDPR Compliance Test',
                    description: 'Tests GDPR compliance',
                    type: 'compliance',
                    weight: 1,
                    threshold: 80,
                    testFunction: async (modelId) => this.runComplianceTest(modelId, 'gdpr')
                }
            ]
        });
        // Премиум набор тестов
        this.testSuites.set('premium', {
            id: 'premium',
            name: 'Premium Certification Tests',
            description: 'Premium tests for AI model certification',
            requiredForLevel: [ai_certification_1.AICertificationLevel.PREMIUM],
            tests: [
                ...this.testSuites.get('standard').tests,
                {
                    id: 'security_test',
                    name: 'Security Test',
                    description: 'Tests security vulnerabilities',
                    type: 'security',
                    weight: 1,
                    threshold: 85,
                    testFunction: async (modelId) => this.runSecurityTest(modelId)
                }
            ]
        });
        // Корпоративный набор тестов
        this.testSuites.set('enterprise', {
            id: 'enterprise',
            name: 'Enterprise Certification Tests',
            description: 'Enterprise-grade tests for AI model certification',
            requiredForLevel: [ai_certification_1.AICertificationLevel.ENTERPRISE],
            tests: [
                ...this.testSuites.get('premium').tests,
                {
                    id: 'compliance_hipaa',
                    name: 'HIPAA Compliance Test',
                    description: 'Tests HIPAA compliance',
                    type: 'compliance',
                    weight: 1,
                    threshold: 90,
                    testFunction: async (modelId) => this.runComplianceTest(modelId, 'hipaa')
                }
            ]
        });
        // Государственный набор тестов
        this.testSuites.set('government', {
            id: 'government',
            name: 'Government Certification Tests',
            description: 'Government-grade tests for AI model certification',
            requiredForLevel: [ai_certification_1.AICertificationLevel.GOVERNMENT],
            tests: [
                ...this.testSuites.get('enterprise').tests,
                {
                    id: 'compliance_iso27001',
                    name: 'ISO 27001 Compliance Test',
                    description: 'Tests ISO 27001 compliance',
                    type: 'compliance',
                    weight: 1,
                    threshold: 95,
                    testFunction: async (modelId) => this.runComplianceTest(modelId, 'iso27001')
                }
            ]
        });
    }
    /**
     * Запуск теста производительности
     */
    async runPerformanceTest(modelId) {
        // Симуляция теста производительности
        const score = Math.random() * 30 + 70; // 70-100
        return {
            id: `perf_${Date.now()}`,
            testName: 'Performance Test',
            testType: 'automated',
            score,
            passed: score >= 70,
            details: `Performance score: ${score.toFixed(1)}`,
            testedAt: new Date(),
            testedBy: 'ai-certification-service'
        };
    }
    /**
     * Запуск теста безопасности
     */
    async runSafetyTest(modelId) {
        // Симуляция теста безопасности
        const score = Math.random() * 20 + 80; // 80-100
        return {
            id: `safety_${Date.now()}`,
            testName: 'Safety Test',
            testType: 'automated',
            score,
            passed: score >= 80,
            details: `Safety score: ${score.toFixed(1)}`,
            testedAt: new Date(),
            testedBy: 'ai-certification-service'
        };
    }
    /**
     * Запуск теста на предвзятость
     */
    async runBiasTest(modelId) {
        // Симуляция теста на предвзятость
        const score = Math.random() * 25 + 75; // 75-100
        return {
            id: `bias_${Date.now()}`,
            testName: 'Bias Test',
            testType: 'automated',
            score,
            passed: score >= 75,
            details: `Bias score: ${score.toFixed(1)}`,
            testedAt: new Date(),
            testedBy: 'ai-certification-service'
        };
    }
    /**
     * Запуск теста соответствия
     */
    async runComplianceTest(modelId, standard) {
        // Симуляция теста соответствия
        const score = Math.random() * 20 + 80; // 80-100
        return {
            id: `compliance_${standard}_${Date.now()}`,
            testName: `${standard.toUpperCase()} Compliance Test`,
            testType: 'automated',
            score,
            passed: score >= 80,
            details: `${standard.toUpperCase()} compliance score: ${score.toFixed(1)}`,
            testedAt: new Date(),
            testedBy: 'ai-certification-service'
        };
    }
    /**
     * Запуск теста безопасности
     */
    async runSecurityTest(modelId) {
        // Симуляция теста безопасности
        const score = Math.random() * 15 + 85; // 85-100
        return {
            id: `security_${Date.now()}`,
            testName: 'Security Test',
            testType: 'automated',
            score,
            passed: score >= 85,
            details: `Security score: ${score.toFixed(1)}`,
            testedAt: new Date(),
            testedBy: 'ai-certification-service'
        };
    }
    /**
     * Сопоставление теста с категорией
     */
    mapTestToCategory(testName) {
        if (testName.toLowerCase().includes('performance'))
            return 'performance';
        if (testName.toLowerCase().includes('safety'))
            return 'safety';
        if (testName.toLowerCase().includes('bias'))
            return 'bias';
        if (testName.toLowerCase().includes('compliance'))
            return 'compliance';
        if (testName.toLowerCase().includes('security'))
            return 'security';
        return 'general';
    }
    /**
     * Получение сертификата по ID модели
     */
    async getCertification(modelId) {
        return this.activeCertifications.get(modelId) || null;
    }
    /**
     * Получение всех активных сертификатов
     */
    async getAllCertifications() {
        return Array.from(this.activeCertifications.values());
    }
    /**
     * Отзыв сертификата
     */
    async revokeCertification(modelId, reason) {
        const certification = this.activeCertifications.get(modelId);
        if (certification) {
            certification.status = ai_certification_1.AICertificationStatus.SUSPENDED;
            certification.metadata = {
                ...certification.metadata,
                revocationReason: reason,
                revokedAt: new Date().toISOString()
            };
            return true;
        }
        return false;
    }
};
exports.AICertificationService = AICertificationService;
exports.AICertificationService = AICertificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AICertificationService);
//# sourceMappingURL=ai-certification.service.js.map