import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

export interface AnonymizationMap {
  [key: string]: string;
}

export interface AnonymizedData {
  data: any;
  mapping: AnonymizationMap;
}

@Injectable()
export class AnonymizationService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly tagLength = 16;

  private encryptionKey: Buffer;

  constructor() {
    // В production используйте переменную окружения для ключа
    const keyString = process.env.ANONYMIZATION_KEY || this.generateKey().toString('hex');
    this.encryptionKey = Buffer.from(keyString, 'hex');
  }

  private generateKey(): Buffer {
    return crypto.randomBytes(this.keyLength);
  }

  private generateIV(): Buffer {
    return crypto.randomBytes(this.ivLength);
  }

  /**
   * Обезличивает конфиденциальные данные в тексте
   */
  anonymizeText(text: string): AnonymizedData {
    const mapping: AnonymizationMap = {};
    let anonymizedText = text || '';

    // Паттерны для поиска конфиденциальных данных
    const patterns = [
      // Email адреса
      {
        regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        prefix: 'EMAIL_',
        type: 'email'
      },
      // Телефонные номера (точные паттерны)
      {
        regex: /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
        prefix: 'PHONE_',
        type: 'phone'
      },
      // Имена (только в контексте "My name is", "I am", "Call me" и т.д.)
      {
        regex: /(?:My name is|I am|I'm|Name:|Call me|I'm called)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
        prefix: 'NAME_',
        type: 'name'
      },
      // IP адреса
      {
        regex: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
        prefix: 'IP_',
        type: 'ip'
      },
      // Кредитные карты
      {
        regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
        prefix: 'CARD_',
        type: 'card'
      },
      // Адреса (содержат слова типа "улица", "дом", "квартира")
      {
        regex: /\b(?:ул\.|улица|дом|кв\.|квартира|пр\.|проспект|пер\.|переулок)\s+[А-Яа-я\w\s\d.,-]+/gi,
        prefix: 'ADDRESS_',
        type: 'address'
      },
      // SSN (Social Security Number)
      {
        regex: /\b\d{3}-\d{2}-\d{4}\b/g,
        prefix: 'SSN_',
        type: 'ssn'
      },
      // Паспортные номера
      {
        regex: /\b[A-Z]{2}\d{6,9}\b/g,
        prefix: 'PASSPORT_',
        type: 'passport'
      }
    ];

    patterns.forEach(pattern => {
      const matches = anonymizedText.match(pattern.regex);
      if (matches) {
        matches.forEach((match, index) => {
          const placeholder = `${pattern.prefix}${index + 1}`;
          
          // Для паттернов с группами захвата (например, имена) берем только группу
          if (pattern.type === 'name' && match.includes('My name is')) {
            const nameMatch = match.match(/(?:My name is|I am|I'm|Name:|Call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i);
            if (nameMatch && nameMatch[1]) {
              mapping[placeholder] = nameMatch[1];
              anonymizedText = anonymizedText.replace(match, match.replace(nameMatch[1], placeholder));
            }
          } else {
            mapping[placeholder] = match;
            anonymizedText = anonymizedText.replace(match, placeholder);
          }
        });
      }
    });

    return {
      data: anonymizedText,
      mapping
    };
  }

  /**
   * Восстанавливает обезличенные данные
   */
  deanonymizeText(anonymizedText: string, mapping: AnonymizationMap): string {
    let restoredText = anonymizedText;

    Object.entries(mapping).forEach(([placeholder, originalValue]) => {
      const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      restoredText = restoredText.replace(regex, originalValue);
    });

    return restoredText;
  }

  /**
   * Обезличивает объект с сообщениями чата
   */
  anonymizeChatMessages(messages: any[]): AnonymizedData {
    const mapping: AnonymizationMap = {};
    const anonymizedMessages = messages.map((message, messageIndex) => {
      if (message.content) {
        const anonymized = this.anonymizeText(message.content);
        
        // Объединяем маппинги с префиксом для каждого сообщения
        Object.entries(anonymized.mapping).forEach(([key, value]) => {
          const uniqueKey = `MSG_${messageIndex}_${key}`;
          mapping[uniqueKey] = value;
        });

        return {
          ...message,
          content: anonymized.data
        };
      }
      return message;
    });

    return {
      data: anonymizedMessages,
      mapping
    };
  }

  /**
   * Восстанавливает обезличенные сообщения чата
   */
  deanonymizeChatMessages(anonymizedMessages: any[], mapping: AnonymizationMap): any[] {
    return anonymizedMessages.map((message, messageIndex) => {
      if (message.content) {
        // Создаем локальный маппинг для этого сообщения
        const localMapping: AnonymizationMap = {};
        Object.entries(mapping).forEach(([key, value]) => {
          if (key.startsWith(`MSG_${messageIndex}_`)) {
            const localKey = key.replace(`MSG_${messageIndex}_`, '');
            localMapping[localKey] = value;
          }
        });

        return {
          ...message,
          content: this.deanonymizeText(message.content, localMapping)
        };
      }
      return message;
    });
  }

  /**
   * Шифрует маппинг для безопасного хранения
   */
  encryptMapping(mapping: AnonymizationMap): string {
    const jsonString = JSON.stringify(mapping);
    const iv = this.generateIV();
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    cipher.setAAD(Buffer.from('anonymization-mapping'));
    
    let encrypted = cipher.update(jsonString, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
  }

  /**
   * Расшифровывает маппинг
   */
  decryptMapping(encryptedMapping: string): AnonymizationMap {
    const [ivHex, tagHex, encrypted] = encryptedMapping.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
    decipher.setAAD(Buffer.from('anonymization-mapping'));
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  /**
   * Создает хеш для отслеживания обезличенных данных
   */
  createDataHash(data: any): string {
    const dataString = JSON.stringify(data);
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }
}
