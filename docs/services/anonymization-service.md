# Anonymization Service

## Описание

Anonymization Service отвечает за анонимизацию персональных данных в запросах к ИИ-моделям, обеспечение конфиденциальности и соответствие требованиям GDPR и других регулятивных стандартов.

## Основные функции

- **Анонимизация персональных данных** в текстовых запросах
- **Обнаружение PII** (Personally Identifiable Information)
- **Замена чувствительных данных** на псевдонимы
- **Маскирование данных** с возможностью восстановления
- **Аудит анонимизации** и логирование операций
- **Соответствие GDPR** и другим стандартам
- **Интеграция с внешними сервисами** анонимизации

## Архитектура

```mermaid
graph TB
    Client[Клиент] --> Gateway[API Gateway]
    Gateway --> Anonymization[Anonymization Service]
    
    Anonymization --> AnonymizationDB[(Anonymization Database)]
    Anonymization --> Redis[(Redis Cache)]
    Anonymization --> RabbitMQ[RabbitMQ]
    
    Anonymization --> OpenAI[OpenAI API]
    Anonymization --> Anthropic[Anthropic API]
    Anonymization --> OpenRouter[OpenRouter API]
    
    Anonymization --> Analytics[Analytics Service]
    Anonymization --> Billing[Billing Service]
```

## Конфигурация

### Переменные окружения

```bash
# Основные настройки
NODE_ENV=development
HOST=0.0.0.0
PORT=3008

# База данных
DATABASE_URL=postgresql://postgres:password@anonymization-db:5432/anonymization_db

# Redis
REDIS_URL=redis://redis:6379

# RabbitMQ
RABBITMQ_URL=amqp://user:password@rabbitmq:5672

# Внешние сервисы
ANALYTICS_SERVICE_URL=http://analytics-service:3005
BILLING_SERVICE_URL=http://billing-service:3004

# Настройки анонимизации
ANONYMIZATION_STRATEGY=replace # replace, mask, hash, encrypt
PII_DETECTION_CONFIDENCE=0.8
ANONYMIZATION_CACHE_TTL=3600
AUDIT_LOG_RETENTION_DAYS=90

# GDPR настройки
GDPR_COMPLIANCE_MODE=true
DATA_RETENTION_DAYS=365
RIGHT_TO_BE_FORGOTTEN=true

# Внешние API
PII_DETECTION_API_URL=https://api.pii-detection.com
ANONYMIZATION_API_URL=https://api.anonymization.com
```

### Docker конфигурация

```yaml
anonymization-service:
  build:
    context: .
    dockerfile: ./services/anonymization-service/Dockerfile
  ports:
    - "3008:3008"
  environment:
    - NODE_ENV=development
    - HOST=0.0.0.0
    - PORT=3008
    - DATABASE_URL=postgresql://postgres:password@anonymization-db:5432/anonymization_db
    - REDIS_URL=redis://redis:6379
    - RABBITMQ_URL=amqp://user:password@rabbitmq:5672
    - GDPR_COMPLIANCE_MODE=true
  depends_on:
    - anonymization-db
    - redis
    - rabbitmq
  networks:
    - ai-aggregator
```

## База данных

### Схема

```sql
-- Анонимизированные данные
CREATE TABLE anonymized_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_text TEXT NOT NULL,
  anonymized_text TEXT NOT NULL,
  anonymization_strategy VARCHAR(50) NOT NULL,
  pii_detected JSONB DEFAULT '{}',
  mapping_data JSONB DEFAULT '{}', -- Для восстановления данных
  company_id UUID NOT NULL,
  request_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- PII паттерны
CREATE TABLE pii_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  pattern VARCHAR(500) NOT NULL,
  category VARCHAR(100) NOT NULL, -- email, phone, ssn, credit_card, etc.
  confidence_threshold DECIMAL(3,2) DEFAULT 0.8,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Аудит анонимизации
CREATE TABLE anonymization_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  operation VARCHAR(100) NOT NULL, -- anonymize, de_anonymize, delete
  data_id UUID REFERENCES anonymized_data(id),
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Настройки анонимизации компании
CREATE TABLE company_anonymization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID UNIQUE NOT NULL,
  anonymization_enabled BOOLEAN DEFAULT true,
  strategy VARCHAR(50) DEFAULT 'replace',
  pii_detection_enabled BOOLEAN DEFAULT true,
  audit_logging_enabled BOOLEAN DEFAULT true,
  data_retention_days INTEGER DEFAULT 365,
  gdpr_compliance BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_anonymized_data_company_id ON anonymized_data(company_id);
CREATE INDEX idx_anonymized_data_request_id ON anonymized_data(request_id);
CREATE INDEX idx_anonymized_data_expires_at ON anonymized_data(expires_at);
CREATE INDEX idx_pii_patterns_category ON pii_patterns(category);
CREATE INDEX idx_pii_patterns_is_active ON pii_patterns(is_active);
CREATE INDEX idx_anonymization_audit_company_id ON anonymization_audit(company_id);
CREATE INDEX idx_anonymization_audit_created_at ON anonymization_audit(created_at);
```

## API Endpoints

### Анонимизация

#### POST /api/v1/anonymize
Анонимизация текста.

**Тело запроса:**
```json
{
  "text": "Меня зовут Иван Петров, мой email: ivan@example.com, телефон: +7-999-123-45-67",
  "strategy": "replace",
  "preserveFormat": true,
  "detectPII": true
}
```

**Ответ:**
```json
{
  "id": "anonymized-uuid",
  "originalText": "Меня зовут Иван Петров, мой email: ivan@example.com, телефон: +7-999-123-45-67",
  "anonymizedText": "Меня зовут [ИМЯ_1], мой email: [EMAIL_1], телефон: [ТЕЛЕФОН_1]",
  "strategy": "replace",
  "piiDetected": [
    {
      "type": "name",
      "value": "Иван Петров",
      "confidence": 0.95,
      "position": [12, 23]
    },
    {
      "type": "email",
      "value": "ivan@example.com",
      "confidence": 0.99,
      "position": [35, 52]
    },
    {
      "type": "phone",
      "value": "+7-999-123-45-67",
      "confidence": 0.98,
      "position": [65, 81]
    }
  ],
  "mappingData": {
    "[ИМЯ_1]": "Иван Петров",
    "[EMAIL_1]": "ivan@example.com",
    "[ТЕЛЕФОН_1]": "+7-999-123-45-67"
  }
}
```

#### POST /api/v1/de-anonymize
Деанонимизация текста.

**Тело запроса:**
```json
{
  "anonymizedText": "Меня зовут [ИМЯ_1], мой email: [EMAIL_1]",
  "mappingData": {
    "[ИМЯ_1]": "Иван Петров",
    "[EMAIL_1]": "ivan@example.com"
  }
}
```

**Ответ:**
```json
{
  "originalText": "Меня зовут Иван Петров, мой email: ivan@example.com"
}
```

#### POST /api/v1/detect-pii
Обнаружение PII в тексте.

**Тело запроса:**
```json
{
  "text": "Меня зовут Иван Петров, мой email: ivan@example.com",
  "confidenceThreshold": 0.8
}
```

**Ответ:**
```json
{
  "piiDetected": [
    {
      "type": "name",
      "value": "Иван Петров",
      "confidence": 0.95,
      "position": [12, 23],
      "category": "person_name"
    },
    {
      "type": "email",
      "value": "ivan@example.com",
      "confidence": 0.99,
      "position": [35, 52],
      "category": "email_address"
    }
  ],
  "totalPII": 2,
  "riskLevel": "medium"
}
```

### Настройки

#### GET /api/v1/anonymization/settings
Получение настроек анонимизации компании.

**Ответ:**
```json
{
  "companyId": "company-uuid",
  "anonymizationEnabled": true,
  "strategy": "replace",
  "piiDetectionEnabled": true,
  "auditLoggingEnabled": true,
  "dataRetentionDays": 365,
  "gdprCompliance": true,
  "allowedPIITypes": ["name", "email", "phone"],
  "blockedPIITypes": ["ssn", "credit_card", "passport"]
}
```

#### PUT /api/v1/anonymization/settings
Обновление настроек анонимизации.

**Тело запроса:**
```json
{
  "anonymizationEnabled": true,
  "strategy": "mask",
  "piiDetectionEnabled": true,
  "auditLoggingEnabled": true,
  "dataRetentionDays": 180,
  "gdprCompliance": true
}
```

### Аудит

#### GET /api/v1/anonymization/audit
Получение логов анонимизации.

**Параметры запроса:**
- `startDate` (string): Дата начала
- `endDate` (string): Дата окончания
- `operation` (string): Тип операции
- `page` (number): Номер страницы
- `limit` (number): Количество записей

**Ответ:**
```json
{
  "data": [
    {
      "id": "audit-uuid",
      "operation": "anonymize",
      "dataId": "anonymized-uuid",
      "details": {
        "piiCount": 3,
        "strategy": "replace",
        "textLength": 85
      },
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2023-12-01T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## Бизнес-логика

### Анонимизация текста

```typescript
@Injectable()
export class AnonymizationService {
  async anonymizeText(
    text: string,
    strategy: AnonymizationStrategy = 'replace',
    companyId: string
  ): Promise<AnonymizationResult> {
    // 1. Обнаружение PII
    const piiDetected = await this.detectPII(text);
    
    if (piiDetected.length === 0) {
      return {
        id: uuidv4(),
        originalText: text,
        anonymizedText: text,
        strategy,
        piiDetected: [],
        mappingData: {}
      };
    }
    
    // 2. Применение стратегии анонимизации
    let anonymizedText = text;
    const mappingData = {};
    
    for (let i = 0; i < piiDetected.length; i++) {
      const pii = piiDetected[i];
      const placeholder = this.generatePlaceholder(pii.type, i + 1);
      
      switch (strategy) {
        case 'replace':
          anonymizedText = anonymizedText.replace(pii.value, placeholder);
          mappingData[placeholder] = pii.value;
          break;
        case 'mask':
          const masked = this.maskValue(pii.value, pii.type);
          anonymizedText = anonymizedText.replace(pii.value, masked);
          break;
        case 'hash':
          const hashed = this.hashValue(pii.value);
          anonymizedText = anonymizedText.replace(pii.value, hashed);
          break;
        case 'encrypt':
          const encrypted = await this.encryptValue(pii.value);
          anonymizedText = anonymizedText.replace(pii.value, encrypted);
          mappingData[encrypted] = pii.value;
          break;
      }
    }
    
    // 3. Сохранение в БД
    const anonymizedData = await this.prisma.anonymizedData.create({
      data: {
        originalText: text,
        anonymizedText,
        anonymizationStrategy: strategy,
        piiDetected,
        mappingData,
        companyId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 часа
      }
    });
    
    // 4. Логирование аудита
    await this.logAnonymizationAudit(companyId, 'anonymize', anonymizedData.id, {
      piiCount: piiDetected.length,
      strategy,
      textLength: text.length
    });
    
    return {
      id: anonymizedData.id,
      originalText: text,
      anonymizedText,
      strategy,
      piiDetected,
      mappingData
    };
  }
  
  private async detectPII(text: string): Promise<PIIDetection[]> {
    const piiDetected = [];
    
    // Получение активных паттернов
    const patterns = await this.prisma.piiPattern.findMany({
      where: { isActive: true }
    });
    
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.pattern, 'gi');
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        const confidence = this.calculateConfidence(match[0], pattern.category);
        
        if (confidence >= pattern.confidenceThreshold) {
          piiDetected.push({
            type: pattern.category,
            value: match[0],
            confidence,
            position: [match.index, match.index + match[0].length]
          });
        }
      }
    }
    
    return piiDetected;
  }
  
  private generatePlaceholder(type: string, index: number): string {
    const typeMap = {
      'name': 'ИМЯ',
      'email': 'EMAIL',
      'phone': 'ТЕЛЕФОН',
      'ssn': 'ССН',
      'credit_card': 'КАРТА',
      'address': 'АДРЕС'
    };
    
    const prefix = typeMap[type] || 'PII';
    return `[${prefix}_${index}]`;
  }
  
  private maskValue(value: string, type: string): string {
    switch (type) {
      case 'email':
        const [local, domain] = value.split('@');
        return `${local[0]}***@${domain}`;
      case 'phone':
        return value.replace(/\d/g, '*');
      case 'credit_card':
        return value.replace(/\d(?=\d{4})/g, '*');
      default:
        return value.replace(/./g, '*');
    }
  }
}
```

### Обнаружение PII

```typescript
@Injectable()
export class PIIDetectionService {
  async detectPII(
    text: string,
    confidenceThreshold: number = 0.8
  ): Promise<PIIDetectionResult> {
    const piiDetected = [];
    
    // 1. Email адреса
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = this.extractMatches(text, emailPattern, 'email', 0.99);
    piiDetected.push(...emails);
    
    // 2. Телефонные номера
    const phonePattern = /(\+?7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}/g;
    const phones = this.extractMatches(text, phonePattern, 'phone', 0.95);
    piiDetected.push(...phones);
    
    // 3. Имена (простая эвристика)
    const namePattern = /\b[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+\b/g;
    const names = this.extractMatches(text, namePattern, 'name', 0.85);
    piiDetected.push(...names);
    
    // 4. ИНН
    const innPattern = /\b\d{10,12}\b/g;
    const inns = this.extractMatches(text, innPattern, 'inn', 0.9);
    piiDetected.push(...inns);
    
    // 5. Паспортные данные
    const passportPattern = /\b\d{4}\s?\d{6}\b/g;
    const passports = this.extractMatches(text, passportPattern, 'passport', 0.95);
    piiDetected.push(...passports);
    
    // Фильтрация по порогу уверенности
    const filteredPII = piiDetected.filter(pii => pii.confidence >= confidenceThreshold);
    
    // Расчет уровня риска
    const riskLevel = this.calculateRiskLevel(filteredPII);
    
    return {
      piiDetected: filteredPII,
      totalPII: filteredPII.length,
      riskLevel
    };
  }
  
  private extractMatches(
    text: string,
    pattern: RegExp,
    type: string,
    baseConfidence: number
  ): PIIDetection[] {
    const matches = [];
    let match;
    
    while ((match = pattern.exec(text)) !== null) {
      const confidence = this.adjustConfidence(match[0], type, baseConfidence);
      
      matches.push({
        type,
        value: match[0],
        confidence,
        position: [match.index, match.index + match[0].length],
        category: this.getCategory(type)
      });
    }
    
    return matches;
  }
  
  private adjustConfidence(value: string, type: string, baseConfidence: number): number {
    let confidence = baseConfidence;
    
    // Дополнительные проверки для повышения точности
    switch (type) {
      case 'email':
        if (value.includes('@') && value.includes('.')) {
          confidence += 0.05;
        }
        break;
      case 'phone':
        if (value.replace(/\D/g, '').length >= 10) {
          confidence += 0.05;
        }
        break;
      case 'name':
        const words = value.split(' ');
        if (words.length >= 2 && words.every(word => /^[А-ЯЁ][а-яё]+$/.test(word))) {
          confidence += 0.1;
        }
        break;
    }
    
    return Math.min(confidence, 1.0);
  }
  
  private calculateRiskLevel(piiDetected: PIIDetection[]): string {
    const highRiskTypes = ['ssn', 'passport', 'credit_card'];
    const mediumRiskTypes = ['email', 'phone', 'inn'];
    const lowRiskTypes = ['name', 'address'];
    
    const hasHighRisk = piiDetected.some(pii => highRiskTypes.includes(pii.type));
    const hasMediumRisk = piiDetected.some(pii => mediumRiskTypes.includes(pii.type));
    const hasLowRisk = piiDetected.some(pii => lowRiskTypes.includes(pii.type));
    
    if (hasHighRisk) return 'high';
    if (hasMediumRisk) return 'medium';
    if (hasLowRisk) return 'low';
    return 'none';
  }
}
```

### Управление настройками

```typescript
@Injectable()
export class AnonymizationSettingsService {
  async getCompanySettings(companyId: string): Promise<AnonymizationSettings> {
    let settings = await this.prisma.companyAnonymizationSettings.findUnique({
      where: { companyId }
    });
    
    if (!settings) {
      // Создание настроек по умолчанию
      settings = await this.prisma.companyAnonymizationSettings.create({
        data: {
          companyId,
          anonymizationEnabled: true,
          strategy: 'replace',
          piiDetectionEnabled: true,
          auditLoggingEnabled: true,
          dataRetentionDays: 365,
          gdprCompliance: true
        }
      });
    }
    
    return {
      companyId: settings.companyId,
      anonymizationEnabled: settings.anonymizationEnabled,
      strategy: settings.strategy,
      piiDetectionEnabled: settings.piiDetectionEnabled,
      auditLoggingEnabled: settings.auditLoggingEnabled,
      dataRetentionDays: settings.dataRetentionDays,
      gdprCompliance: settings.gdprCompliance,
      allowedPIITypes: this.getAllowedPIITypes(settings),
      blockedPIITypes: this.getBlockedPIITypes(settings)
    };
  }
  
  async updateCompanySettings(
    companyId: string,
    updates: Partial<AnonymizationSettings>
  ): Promise<AnonymizationSettings> {
    const settings = await this.prisma.companyAnonymizationSettings.upsert({
      where: { companyId },
      update: {
        anonymizationEnabled: updates.anonymizationEnabled,
        strategy: updates.strategy,
        piiDetectionEnabled: updates.piiDetectionEnabled,
        auditLoggingEnabled: updates.auditLoggingEnabled,
        dataRetentionDays: updates.dataRetentionDays,
        gdprCompliance: updates.gdprCompliance
      },
      create: {
        companyId,
        anonymizationEnabled: updates.anonymizationEnabled ?? true,
        strategy: updates.strategy ?? 'replace',
        piiDetectionEnabled: updates.piiDetectionEnabled ?? true,
        auditLoggingEnabled: updates.auditLoggingEnabled ?? true,
        dataRetentionDays: updates.dataRetentionDays ?? 365,
        gdprCompliance: updates.gdprCompliance ?? true
      }
    });
    
    return this.getCompanySettings(companyId);
  }
}
```

## Мониторинг

### Health Check

```typescript
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly rabbitMQ: RabbitMQService
  ) {}
  
  @Get()
  async checkHealth() {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkRabbitMQ(),
      this.checkPIIDetection()
    ]);
    
    const isHealthy = checks.every(check => 
      check.status === 'fulfilled'
    );
    
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: checks[0].status === 'fulfilled' ? 'up' : 'down',
        redis: checks[1].status === 'fulfilled' ? 'up' : 'down',
        rabbitmq: checks[2].status === 'fulfilled' ? 'up' : 'down',
        piiDetection: checks[3].status === 'fulfilled' ? 'up' : 'down'
      }
    };
  }
  
  private async checkPIIDetection(): Promise<boolean> {
    try {
      // Тестирование обнаружения PII
      const testText = "Мой email: test@example.com";
      const result = await this.piiDetectionService.detectPII(testText);
      return result.piiDetected.length > 0;
    } catch (error) {
      return false;
    }
  }
}
```

## Troubleshooting

### Частые проблемы

#### 1. Проблемы с обнаружением PII

```bash
# Проверка паттернов PII
docker-compose exec anonymization-db psql -U postgres -d anonymization_db -c "SELECT * FROM pii_patterns WHERE is_active = true;"

# Тестирование обнаружения
curl -X POST http://localhost:3008/api/v1/detect-pii \
  -H "Content-Type: application/json" \
  -d '{"text": "Мой email: test@example.com"}'
```

#### 2. Проблемы с анонимизацией

```bash
# Проверка настроек компании
docker-compose exec anonymization-db psql -U postgres -d anonymization_db -c "SELECT * FROM company_anonymization_settings;"

# Проверка анонимизированных данных
docker-compose exec anonymization-db psql -U postgres -d anonymization_db -c "SELECT COUNT(*) FROM anonymized_data;"
```

#### 3. Проблемы с GDPR

```bash
# Проверка настроек GDPR
docker-compose exec anonymization-db psql -U postgres -d anonymization_db -c "SELECT company_id, gdpr_compliance, data_retention_days FROM company_anonymization_settings;"

# Проверка аудита
docker-compose exec anonymization-db psql -U postgres -d anonymization_db -c "SELECT operation, COUNT(*) FROM anonymization_audit GROUP BY operation;"
```

### Полезные команды

```bash
# Перезапуск сервиса
docker-compose restart anonymization-service

# Просмотр логов
docker-compose logs -f anonymization-service

# Очистка истекших данных
docker-compose exec anonymization-db psql -U postgres -d anonymization_db -c "DELETE FROM anonymized_data WHERE expires_at < NOW();"

# Тестирование анонимизации
curl -X POST http://localhost:3008/api/v1/anonymize \
  -H "Content-Type: application/json" \
  -d '{"text": "Меня зовут Иван Петров, email: ivan@example.com"}'
```
