"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnonymizationService = void 0;
const common_1 = require("@nestjs/common");
let AnonymizationService = class AnonymizationService {
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
    deanonymizeText(text, mapping) {
        if (!text || typeof text !== 'string') {
            return text;
        }
        let deanonymizedText = text;
        Object.entries(mapping).forEach(([anonymized, original]) => {
            const regex = new RegExp(anonymized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            deanonymizedText = deanonymizedText.replace(regex, original);
        });
        return deanonymizedText;
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
exports.AnonymizationService = AnonymizationService = __decorate([
    (0, common_1.Injectable)()
], AnonymizationService);
//# sourceMappingURL=anonymization.service.js.map