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
exports.AIClassificationService = void 0;
const common_1 = require("@nestjs/common");
const ai_certification_1 = require("../types/ai-certification");
let AIClassificationService = class AIClassificationService {
    categoryPatterns = new Map();
    capabilityTests = new Map();
    constructor() {
        this.initializeCategoryPatterns();
        this.initializeCapabilityTests();
    }
    /**
     * Автоматическая классификация ИИ-модели
     */
    async classifyModel(request) {
        try {
            // 1. Анализ метаданных
            const metadataAnalysis = await this.analyzeMetadata(request);
            // 2. Автоматическое тестирование
            const testResults = await this.runAutomatedTests(request.modelId, request.testData);
            // 3. Определение возможностей
            const capabilities = await this.detectCapabilities(testResults);
            // 4. Классификация по категориям
            const categories = await this.categorizeModel(capabilities, metadataAnalysis);
            // 5. Создание результата классификации
            const classification = {
                id: `class_${Date.now()}`,
                modelId: request.modelId,
                categories,
                primaryCategory: categories[0],
                confidence: this.calculateConfidence(categories, capabilities),
                tags: this.generateTags(categories, capabilities),
                capabilities,
                limitations: this.identifyLimitations(testResults),
                useCases: this.suggestUseCases(categories, capabilities),
                risks: this.identifyRisks(testResults),
                recommendations: this.generateRecommendations(testResults, capabilities),
                classifiedAt: new Date(),
                classifiedBy: 'ai-classification-service',
                version: '1.0.0'
            };
            return {
                success: true,
                classification,
                warnings: this.generateWarnings(testResults),
                recommendations: classification.recommendations
            };
        }
        catch (error) {
            return {
                success: false,
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                warnings: [],
                recommendations: ['Повторите попытку классификации позже']
            };
        }
    }
    /**
     * Анализ метаданных модели
     */
    async analyzeMetadata(request) {
        const metadata = {
            id: request.modelId,
            name: request.modelName,
            provider: request.provider,
            version: '1.0.0',
            description: request.description,
            capabilities: request.capabilities,
            limitations: []
        };
        // Анализ архитектуры на основе названия модели
        if (request.modelName.toLowerCase().includes('gpt')) {
            metadata.architecture = 'Transformer';
        }
        else if (request.modelName.toLowerCase().includes('claude')) {
            metadata.architecture = 'Constitutional AI';
        }
        else if (request.modelName.toLowerCase().includes('yandex')) {
            metadata.architecture = 'YandexGPT';
        }
        return metadata;
    }
    /**
     * Запуск автоматических тестов
     */
    async runAutomatedTests(modelId, testData) {
        // Симуляция тестирования производительности
        const performance = {
            modelId,
            category: ai_certification_1.AICategory.TEXT_GENERATION,
            accuracy: Math.random() * 0.3 + 0.7, // 0.7-1.0
            precision: Math.random() * 0.3 + 0.7,
            recall: Math.random() * 0.3 + 0.7,
            f1Score: Math.random() * 0.3 + 0.7,
            latency: Math.random() * 1000 + 100, // 100-1100ms
            throughput: Math.random() * 50 + 10, // 10-60 req/s
            reliability: Math.random() * 0.1 + 0.9, // 90-100%
            costPerToken: Math.random() * 0.001 + 0.0001,
            energyEfficiency: Math.random() * 0.3 + 0.7,
            biasScore: Math.random() * 0.2 + 0.1, // 0.1-0.3
            fairnessScore: Math.random() * 0.3 + 0.7, // 0.7-1.0
            measuredAt: new Date(),
            testDataset: 'standard-test-set',
            sampleSize: 1000
        };
        // Тестирование безопасности
        const safety = {
            toxicityScore: Math.random() * 0.2, // 0-0.2
            harmfulContentDetected: Math.random() > 0.9, // 10% chance
            misinformationRisk: Math.random() * 0.3, // 0-0.3
            privacyRisk: Math.random() * 0.2 // 0-0.2
        };
        // Тестирование на предвзятость
        const bias = {
            genderBias: Math.random() * 0.2, // 0-0.2
            racialBias: Math.random() * 0.2,
            ageBias: Math.random() * 0.2,
            culturalBias: Math.random() * 0.2,
            overallBiasScore: Math.random() * 0.2
        };
        // Тестирование соответствия
        const compliance = {
            gdpr: Math.random() > 0.2, // 80% chance
            hipaa: Math.random() > 0.3, // 70% chance
            iso27001: Math.random() > 0.4, // 60% chance
            soc2: Math.random() > 0.3, // 70% chance
            custom: {}
        };
        return { performance, safety, bias, compliance };
    }
    /**
     * Определение возможностей модели
     */
    async detectCapabilities(testResults) {
        const capabilities = [];
        // Анализ производительности для определения возможностей
        if (testResults.performance.accuracy > 0.8) {
            capabilities.push({
                id: 'high_accuracy',
                name: 'High Accuracy',
                description: 'Model demonstrates high accuracy in tasks',
                category: ai_certification_1.AICategory.TEXT_GENERATION,
                isSupported: true,
                confidence: testResults.performance.accuracy
            });
        }
        if (testResults.performance.latency < 500) {
            capabilities.push({
                id: 'fast_response',
                name: 'Fast Response',
                description: 'Model provides fast response times',
                category: ai_certification_1.AICategory.CONVERSATION,
                isSupported: true,
                confidence: 1 - (testResults.performance.latency / 1000)
            });
        }
        if (testResults.safety.toxicityScore < 0.1) {
            capabilities.push({
                id: 'safe_content',
                name: 'Safe Content Generation',
                description: 'Model generates safe, non-toxic content',
                category: ai_certification_1.AICategory.TEXT_GENERATION,
                isSupported: true,
                confidence: 1 - testResults.safety.toxicityScore
            });
        }
        if (testResults.bias.overallBiasScore < 0.1) {
            capabilities.push({
                id: 'unbiased',
                name: 'Unbiased Output',
                description: 'Model shows minimal bias in outputs',
                category: ai_certification_1.AICategory.CLASSIFICATION,
                isSupported: true,
                confidence: 1 - testResults.bias.overallBiasScore
            });
        }
        return capabilities;
    }
    /**
     * Классификация модели по категориям
     */
    async categorizeModel(capabilities, metadata) {
        const categories = [];
        const categoryScores = new Map();
        // Анализ возможностей для определения категорий
        for (const capability of capabilities) {
            const currentScore = categoryScores.get(capability.category) || 0;
            categoryScores.set(capability.category, currentScore + capability.confidence);
        }
        // Анализ названия модели
        const modelName = metadata.name.toLowerCase();
        if (modelName.includes('gpt') || modelName.includes('claude')) {
            categoryScores.set(ai_certification_1.AICategory.CONVERSATION, (categoryScores.get(ai_certification_1.AICategory.CONVERSATION) || 0) + 0.8);
            categoryScores.set(ai_certification_1.AICategory.TEXT_GENERATION, (categoryScores.get(ai_certification_1.AICategory.TEXT_GENERATION) || 0) + 0.9);
        }
        if (modelName.includes('translate') || modelName.includes('translation')) {
            categoryScores.set(ai_certification_1.AICategory.TRANSLATION, (categoryScores.get(ai_certification_1.AICategory.TRANSLATION) || 0) + 0.9);
        }
        if (modelName.includes('code') || modelName.includes('programming')) {
            categoryScores.set(ai_certification_1.AICategory.CODE_GENERATION, (categoryScores.get(ai_certification_1.AICategory.CODE_GENERATION) || 0) + 0.9);
        }
        // Сортировка по убыванию баллов
        const sortedCategories = Array.from(categoryScores.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([category]) => category);
        return sortedCategories.slice(0, 3); // Топ-3 категории
    }
    /**
     * Инициализация паттернов для категорий
     */
    initializeCategoryPatterns() {
        this.categoryPatterns.set(ai_certification_1.AICategory.TEXT_GENERATION, [
            /text.*generat/i,
            /language.*model/i,
            /gpt/i,
            /claude/i
        ]);
        this.categoryPatterns.set(ai_certification_1.AICategory.CODE_GENERATION, [
            /code.*generat/i,
            /programming/i,
            /developer/i,
            /coding/i
        ]);
        this.categoryPatterns.set(ai_certification_1.AICategory.IMAGE_GENERATION, [
            /image.*generat/i,
            /dall-e/i,
            /midjourney/i,
            /stable.*diffusion/i
        ]);
        this.categoryPatterns.set(ai_certification_1.AICategory.TRANSLATION, [
            /translat/i,
            /language.*convert/i,
            /multilingual/i
        ]);
    }
    /**
     * Инициализация тестов возможностей
     */
    initializeCapabilityTests() {
        this.capabilityTests.set('text_generation', async (model) => {
            // Симуляция теста генерации текста
            return Math.random() > 0.2;
        });
        this.capabilityTests.set('code_generation', async (model) => {
            // Симуляция теста генерации кода
            return Math.random() > 0.3;
        });
        this.capabilityTests.set('translation', async (model) => {
            // Симуляция теста перевода
            return Math.random() > 0.25;
        });
    }
    /**
     * Вычисление уверенности в классификации
     */
    calculateConfidence(categories, capabilities) {
        const capabilityConfidence = capabilities.reduce((sum, cap) => sum + cap.confidence, 0) / capabilities.length;
        const categoryConfidence = categories.length > 0 ? 0.8 : 0.5;
        return (capabilityConfidence + categoryConfidence) / 2;
    }
    /**
     * Генерация тегов
     */
    generateTags(categories, capabilities) {
        const tags = [];
        categories.forEach(category => {
            tags.push(category.replace('_', '-'));
        });
        capabilities.forEach(capability => {
            if (capability.confidence > 0.7) {
                tags.push(capability.name.toLowerCase().replace(/\s+/g, '-'));
            }
        });
        return [...new Set(tags)];
    }
    /**
     * Выявление ограничений
     */
    identifyLimitations(testResults) {
        const limitations = [];
        if (testResults.performance.latency > 1000) {
            limitations.push('High latency may impact user experience');
        }
        if (testResults.safety.toxicityScore > 0.1) {
            limitations.push('May generate potentially toxic content');
        }
        if (testResults.bias.overallBiasScore > 0.2) {
            limitations.push('May exhibit bias in certain contexts');
        }
        if (testResults.performance.accuracy < 0.8) {
            limitations.push('Accuracy may be insufficient for critical applications');
        }
        return limitations;
    }
    /**
     * Предложение случаев использования
     */
    suggestUseCases(categories, capabilities) {
        const useCases = [];
        if (categories.includes(ai_certification_1.AICategory.TEXT_GENERATION)) {
            useCases.push('Content creation and writing assistance');
        }
        if (categories.includes(ai_certification_1.AICategory.CONVERSATION)) {
            useCases.push('Customer support and chatbots');
        }
        if (categories.includes(ai_certification_1.AICategory.CODE_GENERATION)) {
            useCases.push('Software development assistance');
        }
        if (categories.includes(ai_certification_1.AICategory.TRANSLATION)) {
            useCases.push('Multilingual content translation');
        }
        return useCases;
    }
    /**
     * Выявление рисков
     */
    identifyRisks(testResults) {
        const risks = [];
        if (testResults.safety.harmfulContentDetected) {
            risks.push('Risk of generating harmful content');
        }
        if (testResults.bias.overallBiasScore > 0.3) {
            risks.push('High risk of biased outputs');
        }
        if (testResults.safety.misinformationRisk > 0.2) {
            risks.push('Risk of generating misinformation');
        }
        if (testResults.performance.reliability < 0.95) {
            risks.push('Reliability concerns for production use');
        }
        return risks;
    }
    /**
     * Генерация рекомендаций
     */
    generateRecommendations(testResults, capabilities) {
        const recommendations = [];
        if (testResults.bias.overallBiasScore > 0.1) {
            recommendations.push('Consider additional bias mitigation training');
        }
        if (testResults.safety.toxicityScore > 0.05) {
            recommendations.push('Implement content filtering mechanisms');
        }
        if (testResults.performance.accuracy < 0.9) {
            recommendations.push('Consider fine-tuning on domain-specific data');
        }
        if (testResults.performance.latency > 500) {
            recommendations.push('Optimize model for faster inference');
        }
        return recommendations;
    }
    /**
     * Генерация предупреждений
     */
    generateWarnings(testResults) {
        const warnings = [];
        if (testResults.safety.harmfulContentDetected) {
            warnings.push('Model may generate harmful content - implement safety measures');
        }
        if (testResults.bias.overallBiasScore > 0.2) {
            warnings.push('Model shows significant bias - consider additional training');
        }
        if (testResults.performance.reliability < 0.9) {
            warnings.push('Model reliability is below recommended threshold');
        }
        return warnings;
    }
};
exports.AIClassificationService = AIClassificationService;
exports.AIClassificationService = AIClassificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AIClassificationService);
//# sourceMappingURL=ai-classification.service.js.map