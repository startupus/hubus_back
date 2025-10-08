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
var AnonymizationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnonymizationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const shared_1 = require("@ai-aggregator/shared");
let AnonymizationService = AnonymizationService_1 = class AnonymizationService {
    prisma;
    logger = new common_1.Logger(AnonymizationService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSettings(provider, model) {
        try {
            const settings = await this.prisma.anonymizationSettings.findFirst({
                where: {
                    provider,
                    model,
                },
                orderBy: { updatedAt: 'desc' },
            });
            return settings ? this.transformSettings(settings) : null;
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Failed to get anonymization settings', error, {
                provider,
                model,
            });
            return null;
        }
    }
    async getAllSettings() {
        try {
            const settings = await this.prisma.anonymizationSettings.findMany({
                orderBy: { updatedAt: 'desc' },
            });
            return settings.map(s => this.transformSettings(s));
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Failed to get all anonymization settings', error);
            return [];
        }
    }
    async upsertSettings(dto) {
        try {
            const settings = await this.prisma.anonymizationSettings.upsert({
                where: {
                    provider_model: {
                        provider: dto.provider,
                        model: dto.model,
                    },
                },
                update: {
                    enabled: dto.enabled,
                    preserveMetadata: dto.preserveMetadata ?? true,
                    updatedBy: dto.createdBy,
                    updatedAt: new Date(),
                },
                create: {
                    provider: dto.provider,
                    model: dto.model,
                    enabled: dto.enabled,
                    preserveMetadata: dto.preserveMetadata ?? true,
                    createdBy: dto.createdBy,
                    updatedBy: dto.createdBy,
                },
            });
            shared_1.LoggerUtil.info('api-gateway', 'Anonymization settings upserted', {
                provider: dto.provider,
                model: dto.model,
                enabled: dto.enabled,
                createdBy: dto.createdBy,
            });
            return this.transformSettings(settings);
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Failed to upsert anonymization settings', error, {
                provider: dto.provider,
                model: dto.model,
                createdBy: dto.createdBy,
            });
            throw error;
        }
    }
    async updateSettings(id, dto) {
        try {
            const settings = await this.prisma.anonymizationSettings.update({
                where: { id },
                data: {
                    enabled: dto.enabled,
                    preserveMetadata: dto.preserveMetadata,
                    updatedBy: dto.updatedBy,
                    updatedAt: new Date(),
                },
            });
            shared_1.LoggerUtil.info('api-gateway', 'Anonymization settings updated', {
                id,
                enabled: dto.enabled,
                updatedBy: dto.updatedBy,
            });
            return this.transformSettings(settings);
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Failed to update anonymization settings', error, {
                id,
                updatedBy: dto.updatedBy,
            });
            throw error;
        }
    }
    async deleteSettings(id, deletedBy) {
        try {
            await this.prisma.anonymizationSettings.delete({
                where: { id },
            });
            shared_1.LoggerUtil.info('api-gateway', 'Anonymization settings deleted', {
                id,
                deletedBy,
            });
            return true;
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Failed to delete anonymization settings', error, {
                id,
                deletedBy,
            });
            return false;
        }
    }
    async shouldAnonymize(provider, model) {
        try {
            const settings = await this.getSettings(provider, model);
            if (!settings) {
                const providerSettings = await this.prisma.anonymizationSettings.findFirst({
                    where: {
                        provider,
                        model: '*',
                    },
                    orderBy: { updatedAt: 'desc' },
                });
                return providerSettings ? providerSettings.enabled : false;
            }
            return settings.enabled;
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Failed to check anonymization settings', error, {
                provider,
                model,
            });
            return false;
        }
    }
    async searchSettings(params) {
        try {
            const { provider, model, enabled, limit = 50, offset = 0 } = params;
            const where = {};
            if (provider)
                where.provider = { contains: provider };
            if (model)
                where.model = { contains: model };
            if (enabled !== undefined)
                where.enabled = enabled;
            const [settings, total] = await Promise.all([
                this.prisma.anonymizationSettings.findMany({
                    where,
                    orderBy: { updatedAt: 'desc' },
                    take: limit,
                    skip: offset,
                }),
                this.prisma.anonymizationSettings.count({ where }),
            ]);
            return {
                data: settings.map(s => this.transformSettings(s)),
                total,
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Failed to search anonymization settings', error, {
                params,
            });
            return { data: [], total: 0 };
        }
    }
    transformSettings(settings) {
        return {
            id: settings.id,
            provider: settings.provider,
            model: settings.model,
            enabled: settings.enabled,
            preserveMetadata: settings.preserveMetadata,
            createdBy: settings.createdBy,
            createdAt: settings.createdAt,
            updatedAt: settings.updatedAt,
        };
    }
    anonymizeChatMessages(messages) {
        const mapping = {};
        let counter = 1;
        const anonymizedMessages = messages.map(message => ({
            ...message,
            content: this.anonymizeText(message.content, mapping, counter++)
        }));
        return {
            data: anonymizedMessages,
            mapping
        };
    }
    deanonymizeChatMessages(messages, mapping) {
        const reverseMapping = this.createReverseMapping(mapping);
        return messages.map(message => ({
            ...message,
            content: this.deanonymizeText(message.content, reverseMapping)
        }));
    }
    anonymizeText(text, mapping = {}, counter = 1) {
        if (!text || typeof text !== 'string') {
            return text;
        }
        const patterns = [
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
            /(\+?7|8)?[\s\-]?\(?[0-9]{3}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}/g,
            /\b[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+\b/g,
            /\b[А-ЯЁ][а-яё]+\s+(улица|ул\.|проспект|пр\.|переулок|пер\.|площадь|пл\.)\s+[А-ЯЁа-яё0-9\s,.-]+/gi,
            /\b\d{10,12}\b/g,
            /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
            /https?:\/\/[^\s]+/g
        ];
        let anonymizedText = text;
        patterns.forEach(pattern => {
            anonymizedText = anonymizedText.replace(pattern, (match) => {
                if (mapping[match]) {
                    return mapping[match];
                }
                const anonymizedValue = this.generateAnonymizedValue(match, counter++);
                mapping[match] = anonymizedValue;
                return anonymizedValue;
            });
        });
        return anonymizedText;
    }
    deanonymizeText(text, reverseMapping) {
        if (!text || typeof text !== 'string') {
            return text;
        }
        let deanonymizedText = text;
        Object.entries(reverseMapping).forEach(([anonymized, original]) => {
            const regex = new RegExp(anonymized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            deanonymizedText = deanonymizedText.replace(regex, original);
        });
        return deanonymizedText;
    }
    createReverseMapping(mapping) {
        const reverseMapping = {};
        Object.entries(mapping).forEach(([original, anonymized]) => {
            reverseMapping[anonymized] = original;
        });
        return reverseMapping;
    }
    generateAnonymizedValue(originalValue, counter) {
        if (originalValue.includes('@')) {
            return `user${counter}@example.com`;
        }
        else if (/^(\+?7|8)?[\s\-]?\(?[0-9]{3}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/.test(originalValue)) {
            return `+7 (XXX) XXX-XX-XX`;
        }
        else if (/^https?:\/\//.test(originalValue)) {
            return `https://example.com`;
        }
        else if (/^\d{10,12}$/.test(originalValue)) {
            return `XXXXXXXXXXXX`;
        }
        else if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(originalValue)) {
            return `XXX.XXX.XXX.XXX`;
        }
        else {
            return `[ОБЕЗЛИЧЕНО_${counter}]`;
        }
    }
};
exports.AnonymizationService = AnonymizationService;
exports.AnonymizationService = AnonymizationService = AnonymizationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnonymizationService);
//# sourceMappingURL=anonymization.service.js.map