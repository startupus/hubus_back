import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { 
  AnonymizeRequestDto, 
  AnonymizeResponseDto,
  DeanonymizeRequestDto,
  DeanonymizeResponseDto,
  AnonymizationSettingsDto,
  AnonymizationSettingsResponseDto,
  ChatMessageDto
} from './dto/anonymization.dto';

@Injectable()
export class AnonymizationService {
  private readonly logger = new Logger(AnonymizationService.name);

  // Default anonymization settings
  private readonly defaultSettings: AnonymizationSettingsDto = {
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

  // In-memory storage for settings (в production будет БД)
  private settingsStorage: Map<string, AnonymizationSettingsResponseDto> = new Map();

  async anonymize(request: AnonymizeRequestDto): Promise<AnonymizeResponseDto> {
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

    const mapping: Record<string, string> = {};
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

  async deanonymize(request: DeanonymizeRequestDto): Promise<DeanonymizeResponseDto> {
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

  async getSettings(userId: string): Promise<AnonymizationSettingsResponseDto> {
    const settings = this.settingsStorage.get(userId);
    
    if (!settings) {
      // Return default settings if not found
      return {
        ...this.defaultSettings,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return settings;
  }

  async updateSettings(userId: string, settings: AnonymizationSettingsDto): Promise<AnonymizationSettingsResponseDto> {
    const now = new Date().toISOString();
    const existingSettings = this.settingsStorage.get(userId);

    const updatedSettings: AnonymizationSettingsResponseDto = {
      ...settings,
      userId,
      createdAt: existingSettings?.createdAt || now,
      updatedAt: now,
    };

    this.settingsStorage.set(userId, updatedSettings);
    this.logger.log(`Updated anonymization settings for user: ${userId}`);

    return updatedSettings;
  }

  async deleteSettings(userId: string): Promise<void> {
    const deleted = this.settingsStorage.delete(userId);
    
    if (!deleted) {
      throw new NotFoundException(`Settings not found for user: ${userId}`);
    }

    this.logger.log(`Deleted anonymization settings for user: ${userId}`);
  }

  private anonymizeText(
    text: string, 
    mapping: Record<string, string>, 
    counter: number,
    settings: AnonymizationSettingsDto
  ): string {
    if (!text || typeof text !== 'string') {
      return text;
    }

    let anonymizedText = text;
    let currentCounter = counter;

    // Email addresses
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

    // Phone numbers
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

    // Names
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

    // Addresses
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

    // Personal numbers (INN, SNILS)
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

    // IP addresses
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

    // URLs
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

    // Custom patterns
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
        } catch (error) {
          this.logger.warn(`Invalid custom pattern: ${pattern}`, error);
        }
      });
    }

    return anonymizedText;
  }

  private deanonymizeText(text: string, reverseMapping: Record<string, string>): string {
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

  private createReverseMapping(mapping: Record<string, string>): Record<string, string> {
    const reverseMapping: Record<string, string> = {};
    Object.entries(mapping).forEach(([original, anonymized]) => {
      reverseMapping[anonymized] = original;
    });
    return reverseMapping;
  }
}
