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
exports.AISafetyService = void 0;
const common_1 = require("@nestjs/common");
const ai_certification_1 = require("../types/ai-certification");
let AISafetyService = class AISafetyService {
    safetyIncidents = new Map();
    riskPatterns = new Map();
    constructor() {
        this.initializeRiskPatterns();
    }
    /**
     * Проведение комплексной оценки безопасности
     */
    async conductSafetyAssessment(request) {
        try {
            // 1. Оценка рисков
            const riskFactors = await this.assessRiskFactors(request.modelId, request.focusAreas);
            // 2. Тестирование контента
            const contentSafety = await this.testContentSafety(request.modelId, request.testData);
            // 3. Оценка предвзятости
            const biasAssessment = await this.assessBias(request.modelId, request.testData);
            // 4. Анализ истории инцидентов
            const incidentHistory = this.getIncidentHistory(request.modelId);
            // 5. Определение уровня безопасности
            const safetyLevel = this.determineSafetyLevel(riskFactors, contentSafety, biasAssessment);
            // 6. Создание оценки безопасности
            const assessment = {
                id: `safety_${Date.now()}`,
                modelId: request.modelId,
                safetyLevel,
                riskFactors,
                mitigationStrategies: this.generateMitigationStrategies(riskFactors),
                monitoringRequirements: this.generateMonitoringRequirements(riskFactors),
                incidentHistory,
                lastAssessment: new Date(),
                nextAssessment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 дней
                assessor: 'ai-safety-service'
            };
            return {
                success: true,
                assessment,
                warnings: this.generateSafetyWarnings(riskFactors, contentSafety, biasAssessment),
                recommendations: this.generateSafetyRecommendations(riskFactors, contentSafety, biasAssessment)
            };
        }
        catch (error) {
            return {
                success: false,
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                warnings: [],
                recommendations: ['Повторите оценку безопасности позже']
            };
        }
    }
    /**
     * Оценка факторов риска
     */
    async assessRiskFactors(modelId, focusAreas) {
        const riskFactors = [];
        const areasToCheck = focusAreas || Object.values(ai_certification_1.RiskFactorCategory);
        for (const area of areasToCheck) {
            const riskFactor = await this.assessSpecificRisk(modelId, area);
            if (riskFactor) {
                riskFactors.push(riskFactor);
            }
        }
        return riskFactors;
    }
    /**
     * Оценка конкретного типа риска
     */
    async assessSpecificRisk(modelId, category) {
        const riskScore = Math.random(); // Симуляция оценки риска
        const impactScore = Math.random();
        const probability = Math.random();
        // Определение серьезности на основе оценок
        let severity = 'low';
        const combinedScore = (riskScore + impactScore + probability) / 3;
        if (combinedScore > 0.8)
            severity = 'critical';
        else if (combinedScore > 0.6)
            severity = 'high';
        else if (combinedScore > 0.4)
            severity = 'medium';
        return {
            id: `risk_${category}_${Date.now()}`,
            category,
            severity,
            description: this.getRiskDescription(category, severity),
            probability,
            impact: impactScore,
            mitigation: this.getMitigationStrategy(category, severity),
            monitoring: this.getMonitoringStrategy(category, severity)
        };
    }
    /**
     * Тестирование безопасности контента
     */
    async testContentSafety(modelId, testData) {
        // Симуляция тестирования контента
        const toxicityScore = Math.random() * 0.3; // 0-0.3
        const harmfulContentDetected = Math.random() > 0.9; // 10% chance
        const confidence = Math.random() * 0.3 + 0.7; // 0.7-1.0
        const detectedRisks = [];
        if (toxicityScore > 0.1)
            detectedRisks.push('High toxicity detected');
        if (harmfulContentDetected)
            detectedRisks.push('Harmful content detected');
        if (confidence < 0.8)
            detectedRisks.push('Low confidence in safety assessment');
        return {
            isSafe: !harmfulContentDetected && toxicityScore < 0.1,
            toxicityScore,
            harmfulContentDetected,
            detectedRisks,
            confidence
        };
    }
    /**
     * Оценка предвзятости
     */
    async assessBias(modelId, testData) {
        // Симуляция оценки предвзятости
        const categoryBiasScores = new Map();
        const categories = ['gender', 'race', 'age', 'religion', 'nationality', 'socioeconomic'];
        let totalBiasScore = 0;
        const detectedBiases = [];
        for (const category of categories) {
            const score = Math.random() * 0.4; // 0-0.4
            categoryBiasScores.set(category, score);
            totalBiasScore += score;
            if (score > 0.2) {
                detectedBiases.push(`${category} bias detected (score: ${score.toFixed(2)})`);
            }
        }
        const overallBiasScore = totalBiasScore / categories.length;
        const recommendations = this.generateBiasRecommendations(categoryBiasScores);
        return {
            overallBiasScore,
            categoryBiasScores,
            detectedBiases,
            recommendations
        };
    }
    /**
     * Определение уровня безопасности
     */
    determineSafetyLevel(riskFactors, contentSafety, biasAssessment) {
        // Подсчет критических рисков
        const criticalRisks = riskFactors.filter(r => r.severity === 'critical').length;
        const highRisks = riskFactors.filter(r => r.severity === 'high').length;
        // Оценка на основе различных факторов
        if (criticalRisks > 0 || !contentSafety.isSafe) {
            return ai_certification_1.AISafetyLevel.HIGH_RISK;
        }
        if (highRisks > 2 || contentSafety.toxicityScore > 0.2 || biasAssessment.overallBiasScore > 0.3) {
            return ai_certification_1.AISafetyLevel.HIGH_RISK;
        }
        if (highRisks > 0 || contentSafety.toxicityScore > 0.1 || biasAssessment.overallBiasScore > 0.2) {
            return ai_certification_1.AISafetyLevel.CAUTION;
        }
        if (contentSafety.toxicityScore > 0.05 || biasAssessment.overallBiasScore > 0.1) {
            return ai_certification_1.AISafetyLevel.CAUTION;
        }
        return ai_certification_1.AISafetyLevel.SAFE;
    }
    /**
     * Генерация стратегий смягчения рисков
     */
    generateMitigationStrategies(riskFactors) {
        const strategies = [];
        for (const risk of riskFactors) {
            if (risk.severity === 'critical' || risk.severity === 'high') {
                strategies.push(`Implement ${risk.mitigation} for ${risk.category} risk`);
            }
        }
        // Общие стратегии
        strategies.push('Implement content filtering mechanisms');
        strategies.push('Regular bias monitoring and retraining');
        strategies.push('Human oversight for high-risk outputs');
        return [...new Set(strategies)];
    }
    /**
     * Генерация требований к мониторингу
     */
    generateMonitoringRequirements(riskFactors) {
        const requirements = [];
        for (const risk of riskFactors) {
            if (risk.severity === 'critical' || risk.severity === 'high') {
                requirements.push(`Continuous monitoring for ${risk.category} risk`);
            }
        }
        // Общие требования
        requirements.push('Real-time content safety monitoring');
        requirements.push('Regular bias assessment reports');
        requirements.push('Incident response procedures');
        return [...new Set(requirements)];
    }
    /**
     * Получение истории инцидентов
     */
    getIncidentHistory(modelId) {
        return this.safetyIncidents.get(modelId) || [];
    }
    /**
     * Генерация предупреждений безопасности
     */
    generateSafetyWarnings(riskFactors, contentSafety, biasAssessment) {
        const warnings = [];
        if (contentSafety.harmfulContentDetected) {
            warnings.push('Model has generated harmful content - implement safety measures');
        }
        if (biasAssessment.overallBiasScore > 0.2) {
            warnings.push('Significant bias detected - consider additional training');
        }
        const criticalRisks = riskFactors.filter(r => r.severity === 'critical');
        if (criticalRisks.length > 0) {
            warnings.push(`${criticalRisks.length} critical safety risks identified`);
        }
        return warnings;
    }
    /**
     * Генерация рекомендаций по безопасности
     */
    generateSafetyRecommendations(riskFactors, contentSafety, biasAssessment) {
        const recommendations = [];
        if (contentSafety.toxicityScore > 0.1) {
            recommendations.push('Implement toxicity filtering');
        }
        if (biasAssessment.overallBiasScore > 0.1) {
            recommendations.push('Conduct bias mitigation training');
        }
        for (const risk of riskFactors) {
            if (risk.severity === 'high' || risk.severity === 'critical') {
                recommendations.push(`Address ${risk.category} risk: ${risk.mitigation}`);
            }
        }
        return recommendations;
    }
    /**
     * Генерация рекомендаций по предвзятости
     */
    generateBiasRecommendations(categoryBiasScores) {
        const recommendations = [];
        for (const [category, score] of categoryBiasScores) {
            if (score > 0.2) {
                recommendations.push(`Address ${category} bias through diverse training data`);
            }
        }
        if (recommendations.length === 0) {
            recommendations.push('Continue monitoring for bias in all categories');
        }
        return recommendations;
    }
    /**
     * Инициализация паттернов рисков
     */
    initializeRiskPatterns() {
        this.riskPatterns.set(ai_certification_1.RiskFactorCategory.BIAS, [
            /discriminat/i,
            /stereotyp/i,
            /prejudic/i
        ]);
        this.riskPatterns.set(ai_certification_1.RiskFactorCategory.MISINFORMATION, [
            /false.*information/i,
            /mislead/i,
            /inaccurate/i
        ]);
        this.riskPatterns.set(ai_certification_1.RiskFactorCategory.PRIVACY, [
            /personal.*data/i,
            /private.*information/i,
            /confidential/i
        ]);
        this.riskPatterns.set(ai_certification_1.RiskFactorCategory.SECURITY, [
            /vulnerabilit/i,
            /exploit/i,
            /attack/i
        ]);
        this.riskPatterns.set(ai_certification_1.RiskFactorCategory.HARMFUL_CONTENT, [
            /violence/i,
            /hate.*speech/i,
            /harassment/i
        ]);
        this.riskPatterns.set(ai_certification_1.RiskFactorCategory.MANIPULATION, [
            /manipulat/i,
            /deceiv/i,
            /trick/i
        ]);
    }
    /**
     * Получение описания риска
     */
    getRiskDescription(category, severity) {
        const descriptions = {
            bias: `Model may exhibit ${severity} bias in outputs`,
            misinformation: `Model may generate ${severity} misinformation`,
            privacy: `Model may have ${severity} privacy vulnerabilities`,
            security: `Model may have ${severity} security vulnerabilities`,
            harmful_content: `Model may generate ${severity} harmful content`,
            manipulation: `Model may be used for ${severity} manipulation`
        };
        return descriptions[category] || `Model has ${severity} risk in ${category}`;
    }
    /**
     * Получение стратегии смягчения
     */
    getMitigationStrategy(category, severity) {
        const strategies = {
            bias: 'Implement bias detection and mitigation training',
            misinformation: 'Add fact-checking and verification mechanisms',
            privacy: 'Implement data protection and anonymization',
            security: 'Conduct security audit and implement safeguards',
            harmful_content: 'Implement content filtering and human review',
            manipulation: 'Add transparency and accountability measures'
        };
        return strategies[category] || 'Implement appropriate safety measures';
    }
    /**
     * Получение стратегии мониторинга
     */
    getMonitoringStrategy(category, severity) {
        const strategies = {
            bias: 'Regular bias assessment and monitoring',
            misinformation: 'Continuous fact-checking and verification',
            privacy: 'Privacy impact assessments and monitoring',
            security: 'Security monitoring and incident response',
            harmful_content: 'Content monitoring and human review',
            manipulation: 'Transparency monitoring and user feedback'
        };
        return strategies[category] || 'Implement appropriate monitoring';
    }
    /**
     * Регистрация инцидента безопасности
     */
    async reportSafetyIncident(incident) {
        const safetyIncident = {
            ...incident,
            id: `incident_${Date.now()}`
        };
        const existingIncidents = this.safetyIncidents.get(incident.modelId) || [];
        existingIncidents.push(safetyIncident);
        this.safetyIncidents.set(incident.modelId, existingIncidents);
        return safetyIncident;
    }
    /**
     * Получение статистики безопасности
     */
    async getSafetyStatistics(modelId) {
        const incidents = this.safetyIncidents.get(modelId) || [];
        const criticalIncidents = incidents.filter(i => i.severity === 'critical').length;
        const resolvedIncidents = incidents.filter(i => i.resolvedAt).length;
        const resolutionTimes = incidents
            .filter(i => i.resolvedAt)
            .map(i => new Date(i.resolvedAt).getTime() - new Date(i.occurredAt).getTime());
        const averageResolutionTime = resolutionTimes.length > 0
            ? resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length
            : 0;
        return {
            totalIncidents: incidents.length,
            criticalIncidents,
            resolvedIncidents,
            averageResolutionTime
        };
    }
};
exports.AISafetyService = AISafetyService;
exports.AISafetyService = AISafetyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AISafetyService);
//# sourceMappingURL=ai-safety.service.js.map