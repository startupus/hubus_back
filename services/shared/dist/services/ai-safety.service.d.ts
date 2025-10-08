import { AISafetyAssessment, SafetyIncident, RiskFactorCategory } from '../types/ai-certification';
export interface SafetyTestRequest {
    modelId: string;
    testData?: any;
    testType: 'comprehensive' | 'quick' | 'targeted';
    focusAreas?: RiskFactorCategory[];
}
export interface SafetyTestResponse {
    success: boolean;
    assessment?: AISafetyAssessment;
    errors?: string[];
    warnings?: string[];
    recommendations?: string[];
}
export interface ContentSafetyResult {
    isSafe: boolean;
    toxicityScore: number;
    harmfulContentDetected: boolean;
    detectedRisks: string[];
    confidence: number;
}
export interface BiasAssessmentResult {
    overallBiasScore: number;
    categoryBiasScores: Map<string, number>;
    detectedBiases: string[];
    recommendations: string[];
}
export declare class AISafetyService {
    private readonly safetyIncidents;
    private readonly riskPatterns;
    constructor();
    /**
     * Проведение комплексной оценки безопасности
     */
    conductSafetyAssessment(request: SafetyTestRequest): Promise<SafetyTestResponse>;
    /**
     * Оценка факторов риска
     */
    private assessRiskFactors;
    /**
     * Оценка конкретного типа риска
     */
    private assessSpecificRisk;
    /**
     * Тестирование безопасности контента
     */
    private testContentSafety;
    /**
     * Оценка предвзятости
     */
    private assessBias;
    /**
     * Определение уровня безопасности
     */
    private determineSafetyLevel;
    /**
     * Генерация стратегий смягчения рисков
     */
    private generateMitigationStrategies;
    /**
     * Генерация требований к мониторингу
     */
    private generateMonitoringRequirements;
    /**
     * Получение истории инцидентов
     */
    private getIncidentHistory;
    /**
     * Генерация предупреждений безопасности
     */
    private generateSafetyWarnings;
    /**
     * Генерация рекомендаций по безопасности
     */
    private generateSafetyRecommendations;
    /**
     * Генерация рекомендаций по предвзятости
     */
    private generateBiasRecommendations;
    /**
     * Инициализация паттернов рисков
     */
    private initializeRiskPatterns;
    /**
     * Получение описания риска
     */
    private getRiskDescription;
    /**
     * Получение стратегии смягчения
     */
    private getMitigationStrategy;
    /**
     * Получение стратегии мониторинга
     */
    private getMonitoringStrategy;
    /**
     * Регистрация инцидента безопасности
     */
    reportSafetyIncident(incident: Omit<SafetyIncident, 'id'> & {
        modelId: string;
    }): Promise<SafetyIncident>;
    /**
     * Получение статистики безопасности
     */
    getSafetyStatistics(modelId: string): Promise<{
        totalIncidents: number;
        criticalIncidents: number;
        resolvedIncidents: number;
        averageResolutionTime: number;
    }>;
}
//# sourceMappingURL=ai-safety.service.d.ts.map