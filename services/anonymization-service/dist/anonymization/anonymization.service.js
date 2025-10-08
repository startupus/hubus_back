"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AnonymizationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnonymizationService = void 0;
const common_1 = require("@nestjs/common");
let AnonymizationService = AnonymizationService_1 = class AnonymizationService {
    constructor() {
        this.logger = new common_1.Logger(AnonymizationService_1.name);
        this.defaultSettings = {
            enabled: true,
            anonymizeEmails: true,
            anonymizePhones: true,
            anonymizeNames: true,
            anonymizeAddresses: true,
            anonymizePersonalNumbers: true,
            anonymizeIPs: true,
            anonymizeURLs: true,
            customPatterns: [],
        };
        this.settingsStorage = new Map();
    }
    async anonymize(request) {
        this.logger.log(`Anonymizing request for user: ${request.userId || 'anonymous'}`);
        const settings = request.userId
            ? await this.getSettings(request.userId)
            : this.defaultSettings;
        if (!settings.enabled) {
            this.logger.log('Anonymization is disabled, returning original data');
            return {
                anonymizedText: request.text,
                anonymizedMessages: request.messages,
                mapping: {},
            };
        }
        const mapping = {};
        let counter = 1;
        if (request.text) {
            const anonymizedText = this.anonymizeText(request.text, mapping, counter, settings);
            return {
                anonymizedText,
                mapping,
            };
        }
        if (request.messages) {
            const anonymizedMessages = request.messages.map(message => ({
                ...message,
                content: this.anonymizeText(message.content, mapping, counter, settings)
            }));
            return {
                anonymizedMessages,
                mapping,
            };
        }
        throw new Error('Either text or messages must be provided');
    }
    async deanonymize(request) {
        this.logger.log('Deanonymizing request');
        const reverseMapping = this.createReverseMapping(request.mapping);
        if (request.text) {
            const deanonymizedText = this.deanonymizeText(request.text, reverseMapping);
            return {
                deanonymizedText,
            };
        }
        if (request.messages) {
            const deanonymizedMessages = request.messages.map(message => ({
                ...message,
                content: this.deanonymizeText(message.content, reverseMapping)
            }));
            return {
                deanonymizedMessages,
            };
        }
        throw new Error('Either text or messages must be provided');
    }
    async getSettings(userId) {
        const settings = this.settingsStorage.get(userId);
        if (!settings) {
            return {
                ...this.defaultSettings,
                userId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
        }
        return settings;
    }
    async updateSettings(userId, settings) {
        const now = new Date().toISOString();
        const existingSettings = this.settingsStorage.get(userId);
        const updatedSettings = {
            ...settings,
            userId,
            createdAt: existingSettings?.createdAt || now,
            updatedAt: now,
        };
        this.settingsStorage.set(userId, updatedSettings);
        this.logger.log(`Updated anonymization settings for user: ${userId}`);
        return updatedSettings;
    }
    async deleteSettings(userId) {
        const deleted = this.settingsStorage.delete(userId);
        if (!deleted) {
            throw new common_1.NotFoundException(`Settings not found for user: ${userId}`);
        }
        this.logger.log(`Deleted anonymization settings for user: ${userId}`);
    }
    anonymizeText(text, mapping, counter, settings) {
        if (!text || typeof text !== 'string') {
            return text;
        }
        let anonymizedText = text;
        let currentCounter = counter;
        if (settings.anonymizeEmails) {
            const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
            anonymizedText = anonymizedText.replace(emailPattern, (match) => {
                if (mapping[match]) {
                    return mapping[match];
                }
                const anonymizedValue = `user${currentCounter}@example.com`;
                mapping[match] = anonymizedValue;
                currentCounter++;
                return anonymizedValue;
            });
        }
        if (settings.anonymizePhones) {
            const phonePattern = /(\+?7|8)?[\s\-]?\(?[0-9]{3}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}/g;
            anonymizedText = anonymizedText.replace(phonePattern, (match) => {
                if (mapping[match]) {
                    return mapping[match];
                }
                const anonymizedValue = `+7 (XXX) XXX-XX-XX`;
                mapping[match] = anonymizedValue;
                return anonymizedValue;
            });
        }
        if (settings.anonymizeNames) {
            const namePattern = /\b[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+\b/g;
            anonymizedText = anonymizedText.replace(namePattern, (match) => {
                if (mapping[match]) {
                    return mapping[match];
                }
                const anonymizedValue = `[ОБЕЗЛИЧЕНО_${currentCounter}]`;
                mapping[match] = anonymizedValue;
                currentCounter++;
                return anonymizedValue;
            });
        }
        if (settings.anonymizeAddresses) {
            const addressPattern = /\b[А-ЯЁ][а-яё]+\s+(улица|ул\.|проспект|пр\.|переулок|пер\.|площадь|пл\.)\s+[А-ЯЁа-яё0-9\s,.-]+/gi;
            anonymizedText = anonymizedText.replace(addressPattern, (match) => {
                if (mapping[match]) {
                    return mapping[match];
                }
                const anonymizedValue = `[АДРЕС_${currentCounter}]`;
                mapping[match] = anonymizedValue;
                currentCounter++;
                return anonymizedValue;
            });
        }
        if (settings.anonymizePersonalNumbers) {
            const personalNumberPattern = /\b\d{10,12}\b/g;
            anonymizedText = anonymizedText.replace(personalNumberPattern, (match) => {
                if (mapping[match]) {
                    return mapping[match];
                }
                const anonymizedValue = `XXXXXXXXXXXX`;
                mapping[match] = anonymizedValue;
                return anonymizedValue;
            });
        }
        if (settings.anonymizeIPs) {
            const ipPattern = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
            anonymizedText = anonymizedText.replace(ipPattern, (match) => {
                if (mapping[match]) {
                    return mapping[match];
                }
                const anonymizedValue = `XXX.XXX.XXX.XXX`;
                mapping[match] = anonymizedValue;
                return anonymizedValue;
            });
        }
        if (settings.anonymizeURLs) {
            const urlPattern = /https?:\/\/[^\s]+/g;
            anonymizedText = anonymizedText.replace(urlPattern, (match) => {
                if (mapping[match]) {
                    return mapping[match];
                }
                const anonymizedValue = `https://example.com`;
                mapping[match] = anonymizedValue;
                return anonymizedValue;
            });
        }
        if (settings.customPatterns && settings.customPatterns.length > 0) {
            settings.customPatterns.forEach(pattern => {
                try {
                    const regex = new RegExp(pattern, 'g');
                    anonymizedText = anonymizedText.replace(regex, (match) => {
                        if (mapping[match]) {
                            return mapping[match];
                        }
                        const anonymizedValue = `[CUSTOM_${currentCounter}]`;
                        mapping[match] = anonymizedValue;
                        currentCounter++;
                        return anonymizedValue;
                    });
                }
                catch (error) {
                    this.logger.warn(`Invalid custom pattern: ${pattern}`, error);
                }
            });
        }
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
};
exports.AnonymizationService = AnonymizationService;
exports.AnonymizationService = AnonymizationService = AnonymizationService_1 = __decorate([
    (0, common_1.Injectable)()
], AnonymizationService);
//# sourceMappingURL=anonymization.service.js.map