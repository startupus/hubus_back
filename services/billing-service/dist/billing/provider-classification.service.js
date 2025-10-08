"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ProviderClassificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderClassificationService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@ai-aggregator/shared");
let ProviderClassificationService = ProviderClassificationService_1 = class ProviderClassificationService {
    constructor() {
        this.logger = new common_1.Logger(ProviderClassificationService_1.name);
        this.domesticProviders = new Set([
            'yandex',
            'sber',
            'gigachat',
            'kandinsky',
            'ruGPT',
            'rugpt',
            'rugpt3',
            'rugpt4',
            'sberbank',
            'sber',
            'yandexgpt',
            'yandex-gpt',
            'yandex_gpt',
            'giga',
            'giga-chat',
            'giga_chat',
            'kandinsky',
            'kandinsky-ai',
            'kandinsky_ai',
            'ru-gpt',
            'ru_gpt',
            'russian-gpt',
            'russian_gpt',
            'domestic',
            'local',
            'russia',
            'russian'
        ]);
        this.foreignProviders = new Set([
            'openai',
            'anthropic',
            'google',
            'microsoft',
            'meta',
            'cohere',
            'huggingface',
            'replicate',
            'together',
            'together-ai',
            'together_ai',
            'openrouter',
            'open-router',
            'open_router',
            'groq',
            'perplexity',
            'mistral',
            'claude',
            'gpt',
            'gpt-3',
            'gpt-4',
            'gpt-3.5',
            'gpt-3.5-turbo',
            'gpt-4-turbo',
            'gpt-4o',
            'claude-3',
            'claude-3-sonnet',
            'claude-3-opus',
            'claude-3-haiku',
            'gemini',
            'gemini-pro',
            'gemini-1.5',
            'llama',
            'llama-2',
            'llama-3',
            'mixtral',
            'mixtral-8x7b',
            'mixtral-8x22b',
            'foreign',
            'international',
            'us',
            'usa',
            'american',
            'european',
            'europe'
        ]);
        this.providerInfo = new Map([
            ['yandex', { name: 'Yandex', type: 'DOMESTIC', country: 'Russia', description: 'Yandex GPT и другие ИИ-модели' }],
            ['sber', { name: 'Sber', type: 'DOMESTIC', country: 'Russia', description: 'GigaChat и другие ИИ-модели Сбера' }],
            ['gigachat', { name: 'GigaChat', type: 'DOMESTIC', country: 'Russia', description: 'ИИ-модель от Сбера' }],
            ['kandinsky', { name: 'Kandinsky', type: 'DOMESTIC', country: 'Russia', description: 'Модель генерации изображений от Сбера' }],
            ['rugpt', { name: 'RuGPT', type: 'DOMESTIC', country: 'Russia', description: 'Российская языковая модель' }],
            ['openai', { name: 'OpenAI', type: 'FOREIGN', country: 'USA', description: 'GPT-3, GPT-4 и другие модели' }],
            ['anthropic', { name: 'Anthropic', type: 'FOREIGN', country: 'USA', description: 'Claude и другие модели' }],
            ['google', { name: 'Google', type: 'FOREIGN', country: 'USA', description: 'Gemini и другие модели' }],
            ['microsoft', { name: 'Microsoft', type: 'FOREIGN', country: 'USA', description: 'Copilot и другие модели' }],
            ['meta', { name: 'Meta', type: 'FOREIGN', country: 'USA', description: 'LLaMA и другие модели' }],
            ['openrouter', { name: 'OpenRouter', type: 'FOREIGN', country: 'USA', description: 'Агрегатор ИИ-моделей' }],
            ['groq', { name: 'Groq', type: 'FOREIGN', country: 'USA', description: 'Быстрые ИИ-модели' }],
            ['mistral', { name: 'Mistral', type: 'FOREIGN', country: 'France', description: 'Европейские ИИ-модели' }],
            ['cohere', { name: 'Cohere', type: 'FOREIGN', country: 'Canada', description: 'Канадские ИИ-модели' }],
        ]);
    }
    classifyProvider(provider) {
        const normalizedProvider = this.normalizeProviderName(provider);
        if (this.domesticProviders.has(normalizedProvider)) {
            shared_1.LoggerUtil.info('billing-service', 'Provider classified as domestic', {
                provider,
                normalizedProvider,
                type: 'DOMESTIC'
            });
            return 'DOMESTIC';
        }
        if (this.foreignProviders.has(normalizedProvider)) {
            shared_1.LoggerUtil.info('billing-service', 'Provider classified as foreign', {
                provider,
                normalizedProvider,
                type: 'FOREIGN'
            });
            return 'FOREIGN';
        }
        shared_1.LoggerUtil.warn('billing-service', 'Unknown provider, defaulting to foreign', {
            provider,
            normalizedProvider,
            type: 'FOREIGN'
        });
        return 'FOREIGN';
    }
    getProviderInfo(provider) {
        const normalizedProvider = this.normalizeProviderName(provider);
        return this.providerInfo.get(normalizedProvider) || null;
    }
    getAllProviders() {
        return Array.from(this.providerInfo.values());
    }
    getProvidersByType(type) {
        return Array.from(this.providerInfo.values()).filter(info => info.type === type);
    }
    addProvider(provider, info) {
        const normalizedProvider = this.normalizeProviderName(provider);
        if (info.type === 'DOMESTIC') {
            this.domesticProviders.add(normalizedProvider);
        }
        else {
            this.foreignProviders.add(normalizedProvider);
        }
        this.providerInfo.set(normalizedProvider, info);
        shared_1.LoggerUtil.info('billing-service', 'Provider added', {
            provider,
            normalizedProvider,
            info
        });
    }
    updateProvider(provider, info) {
        const normalizedProvider = this.normalizeProviderName(provider);
        const existingInfo = this.providerInfo.get(normalizedProvider);
        if (!existingInfo) {
            shared_1.LoggerUtil.warn('billing-service', 'Provider not found for update', {
                provider,
                normalizedProvider
            });
            return;
        }
        const updatedInfo = { ...existingInfo, ...info };
        this.providerInfo.set(normalizedProvider, updatedInfo);
        if (info.type && info.type !== existingInfo.type) {
            if (info.type === 'DOMESTIC') {
                this.domesticProviders.add(normalizedProvider);
                this.foreignProviders.delete(normalizedProvider);
            }
            else {
                this.foreignProviders.add(normalizedProvider);
                this.domesticProviders.delete(normalizedProvider);
            }
        }
        shared_1.LoggerUtil.info('billing-service', 'Provider updated', {
            provider,
            normalizedProvider,
            oldInfo: existingInfo,
            newInfo: updatedInfo
        });
    }
    removeProvider(provider) {
        const normalizedProvider = this.normalizeProviderName(provider);
        this.domesticProviders.delete(normalizedProvider);
        this.foreignProviders.delete(normalizedProvider);
        this.providerInfo.delete(normalizedProvider);
        shared_1.LoggerUtil.info('billing-service', 'Provider removed', {
            provider,
            normalizedProvider
        });
    }
    normalizeProviderName(provider) {
        return provider.toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .trim();
    }
    isDomestic(provider) {
        return this.classifyProvider(provider) === 'DOMESTIC';
    }
    isForeign(provider) {
        return this.classifyProvider(provider) === 'FOREIGN';
    }
    getProviderStats() {
        const allProviders = Array.from(this.providerInfo.values());
        const domestic = allProviders.filter(p => p.type === 'DOMESTIC').length;
        const foreign = allProviders.filter(p => p.type === 'FOREIGN').length;
        return {
            total: allProviders.length,
            domestic,
            foreign,
            unknown: 0
        };
    }
};
exports.ProviderClassificationService = ProviderClassificationService;
exports.ProviderClassificationService = ProviderClassificationService = ProviderClassificationService_1 = __decorate([
    (0, common_1.Injectable)()
], ProviderClassificationService);
//# sourceMappingURL=provider-classification.service.js.map