import { AICertification, AICertificationLevel, TestResult } from '../types/ai-certification';
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
export declare class AICertificationService {
    private readonly testSuites;
    private readonly activeCertifications;
    private readonly auditHistory;
    constructor();
    /**
     * Подача заявки на сертификацию
     */
    submitCertificationRequest(request: CertificationRequest): Promise<CertificationResponse>;
    /**
     * Валидация заявки на сертификацию
     */
    private validateCertificationRequest;
    /**
     * Запуск тестов сертификации
     */
    private runCertificationTests;
    /**
     * Оценка результатов тестирования
     */
    private assessTestResults;
    /**
     * Создание сертификата
     */
    private createCertification;
    /**
     * Извлечение возможностей из результатов тестов
     */
    private extractCapabilities;
    /**
     * Определение уровня безопасности
     */
    private determineSafetyLevel;
    /**
     * Оценка соответствия стандартам
     */
    private assessCompliance;
    /**
     * Проверка конкретного теста соответствия
     */
    private checkComplianceTest;
    /**
     * Получение набора тестов для уровня сертификации
     */
    private getTestSuiteForLevel;
    /**
     * Получение ID набора тестов для уровня
     */
    private getSuiteIdForLevel;
    /**
     * Получение требуемого процента прохождения для уровня
     */
    private getRequiredPassRate;
    /**
     * Получение требуемого балла для уровня
     */
    private getRequiredScore;
    /**
     * Инициализация наборов тестов
     */
    private initializeTestSuites;
    /**
     * Запуск теста производительности
     */
    private runPerformanceTest;
    /**
     * Запуск теста безопасности
     */
    private runSafetyTest;
    /**
     * Запуск теста на предвзятость
     */
    private runBiasTest;
    /**
     * Запуск теста соответствия
     */
    private runComplianceTest;
    /**
     * Запуск теста безопасности
     */
    private runSecurityTest;
    /**
     * Сопоставление теста с категорией
     */
    private mapTestToCategory;
    /**
     * Получение сертификата по ID модели
     */
    getCertification(modelId: string): Promise<AICertification | null>;
    /**
     * Получение всех активных сертификатов
     */
    getAllCertifications(): Promise<AICertification[]>;
    /**
     * Отзыв сертификата
     */
    revokeCertification(modelId: string, reason: string): Promise<boolean>;
}
//# sourceMappingURL=ai-certification.service.d.ts.map