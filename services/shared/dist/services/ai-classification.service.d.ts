import { AIClassificationRequest, AIClassificationResponse, AICategory, AICapability, AIPerformanceMetrics } from '../types/ai-certification';
export interface ModelMetadata {
    id: string;
    name: string;
    provider: string;
    version: string;
    description?: string;
    architecture?: string;
    parameters?: number;
    trainingData?: string;
    capabilities?: string[];
    limitations?: string[];
}
export interface ClassificationResult {
    categories: AICategory[];
    primaryCategory: AICategory;
    confidence: number;
    capabilities: AICapability[];
    limitations: string[];
    recommendations: string[];
}
export interface TestResults {
    performance: AIPerformanceMetrics;
    safety: SafetyTestResults;
    bias: BiasTestResults;
    compliance: ComplianceTestResults;
}
export interface SafetyTestResults {
    toxicityScore: number;
    harmfulContentDetected: boolean;
    misinformationRisk: number;
    privacyRisk: number;
}
export interface BiasTestResults {
    genderBias: number;
    racialBias: number;
    ageBias: number;
    culturalBias: number;
    overallBiasScore: number;
}
export interface ComplianceTestResults {
    gdpr: boolean;
    hipaa: boolean;
    iso27001: boolean;
    soc2: boolean;
    custom: Record<string, boolean>;
}
export declare class AIClassificationService {
    private readonly categoryPatterns;
    private readonly capabilityTests;
    constructor();
    /**
     * Автоматическая классификация ИИ-модели
     */
    classifyModel(request: AIClassificationRequest): Promise<AIClassificationResponse>;
    /**
     * Анализ метаданных модели
     */
    private analyzeMetadata;
    /**
     * Запуск автоматических тестов
     */
    private runAutomatedTests;
    /**
     * Определение возможностей модели
     */
    private detectCapabilities;
    /**
     * Классификация модели по категориям
     */
    private categorizeModel;
    /**
     * Инициализация паттернов для категорий
     */
    private initializeCategoryPatterns;
    /**
     * Инициализация тестов возможностей
     */
    private initializeCapabilityTests;
    /**
     * Вычисление уверенности в классификации
     */
    private calculateConfidence;
    /**
     * Генерация тегов
     */
    private generateTags;
    /**
     * Выявление ограничений
     */
    private identifyLimitations;
    /**
     * Предложение случаев использования
     */
    private suggestUseCases;
    /**
     * Выявление рисков
     */
    private identifyRisks;
    /**
     * Генерация рекомендаций
     */
    private generateRecommendations;
    /**
     * Генерация предупреждений
     */
    private generateWarnings;
}
//# sourceMappingURL=ai-classification.service.d.ts.map