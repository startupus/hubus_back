import { Injectable } from '@nestjs/common';

/**
 * Simple Anonymization Service for Proxy Service
 * Простой сервис обезличивания для proxy-service
 */
@Injectable()
export class AnonymizationService {
  
  /**
   * Обезличивание сообщений чата
   */
  anonymizeChatMessages(messages: any[]): { data: any[]; mapping: Record<string, string> } {
    const mapping: Record<string, string> = {};
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

  /**
   * Обезличивание текста
   */
  anonymizeText(text: string, mapping: Record<string, string> = {}, counter: number = 1): string {
    if (!text || typeof text !== 'string') {
      return text;
    }

    // Паттерны для поиска персональных данных
    const patterns = [
      // Email адреса
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      // Телефонные номера (различные форматы)
      /(\+?7|8)?[\s\-]?\(?[0-9]{3}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}/g,
      // Имена (простые паттерны)
      /\b[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+\b/g,
      // Адреса (упрощенные)
      /\b[А-ЯЁ][а-яё]+\s+(улица|ул\.|проспект|пр\.|переулок|пер\.|площадь|пл\.)\s+[А-ЯЁа-яё0-9\s,.-]+/gi,
      // ИНН, СНИЛС и другие документы
      /\b\d{10,12}\b/g,
      // IP адреса
      /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
      // URL
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

  /**
   * Деобезличивание текста
   */
  deanonymizeText(text: string, mapping: Record<string, string>): string {
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

  /**
   * Генерация обезличенного значения
   */
  private generateAnonymizedValue(originalValue: string, counter: number): string {
    // Определяем тип данных и генерируем соответствующее обезличенное значение
    if (originalValue.includes('@')) {
      return `user${counter}@example.com`;
    } else if (/^(\+?7|8)?[\s\-]?\(?[0-9]{3}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/.test(originalValue)) {
      return `+7 (XXX) XXX-XX-XX`;
    } else if (/^https?:\/\//.test(originalValue)) {
      return `https://example.com`;
    } else if (/^\d{10,12}$/.test(originalValue)) {
      return `XXXXXXXXXXXX`;
    } else if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(originalValue)) {
      return `XXX.XXX.XXX.XXX`;
    } else {
      return `[ОБЕЗЛИЧЕНО_${counter}]`;
    }
  }
}
