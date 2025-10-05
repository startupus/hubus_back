# Analytics Service API Reference

Полная документация API для Analytics Service.

## Базовый URL
```
http://localhost:3005
```

## Аутентификация
Все запросы требуют JWT токен в заголовке:
```
Authorization: Bearer <your-jwt-token>
```

## Общие типы ответов

### Успешный ответ
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "pagination": { ... },
  "metadata": { ... }
}
```

### Ошибка
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

---

## 📊 Analytics API

### События

#### POST /analytics/events/track
Отслеживание одного события.

**Тело запроса:**
```json
{
  "userId": "string (optional)",
  "sessionId": "string (optional)",
  "eventType": "user_action | system_event | ai_interaction | security_event | billing_event | performance_event | error_event",
  "eventName": "string",
  "service": "string",
  "properties": "object",
  "metadata": "object (optional)",
  "ipAddress": "string (optional)",
  "userAgent": "string (optional)"
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "userId": "string",
    "sessionId": "string",
    "eventType": "string",
    "eventName": "string",
    "service": "string",
    "properties": "object",
    "metadata": "object",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "ipAddress": "string",
    "userAgent": "string"
  },
  "message": "Event tracked successfully"
}
```

#### POST /analytics/events/batch
Пакетная отправка событий.

**Тело запроса:**
```json
{
  "events": [
    {
      "eventType": "string",
      "eventName": "string",
      "service": "string",
      "properties": "object"
    }
  ],
  "batchId": "string",
  "source": "string"
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "processed": 100,
    "failed": 0,
    "errors": [],
    "batchId": "string"
  },
  "message": "Events processed successfully"
}
```

#### GET /analytics/events
Получение событий с фильтрацией.

**Параметры запроса:**
- `userId` (string, optional) - Фильтр по пользователю
- `startDate` (string, optional) - Начальная дата (ISO)
- `endDate` (string, optional) - Конечная дата (ISO)
- `eventTypes` (string[], optional) - Типы событий
- `services` (string[], optional) - Сервисы
- `page` (number, optional) - Номер страницы (по умолчанию: 1)
- `limit` (number, optional) - Количество на странице (по умолчанию: 20)
- `sortBy` (string, optional) - Поле сортировки (по умолчанию: timestamp)
- `sortOrder` (string, optional) - Порядок сортировки (asc/desc, по умолчанию: desc)

**Ответ:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "userId": "string",
      "eventType": "string",
      "eventName": "string",
      "service": "string",
      "properties": "object",
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1000,
    "totalPages": 50,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Метрики

#### POST /analytics/metrics/record
Запись одной метрики.

**Тело запроса:**
```json
{
  "service": "string",
  "metricType": "performance | usage | error | resource | business | security",
  "metricName": "string",
  "value": "number",
  "unit": "string",
  "labels": "object",
  "metadata": "object (optional)"
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "service": "string",
    "metricType": "string",
    "metricName": "string",
    "value": 100,
    "unit": "ms",
    "labels": "object",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "metadata": "object"
  },
  "message": "Metrics recorded successfully"
}
```

#### POST /analytics/metrics/batch
Пакетная запись метрик.

**Тело запроса:**
```json
{
  "metrics": [
    {
      "service": "string",
      "metricType": "string",
      "metricName": "string",
      "value": "number",
      "unit": "string",
      "labels": "object"
    }
  ],
  "batchId": "string",
  "source": "string"
}
```

#### GET /analytics/metrics
Получение метрик с фильтрацией.

**Параметры запроса:**
- `service` (string, optional) - Фильтр по сервису
- `metricType` (string, optional) - Тип метрики
- `startDate` (string, optional) - Начальная дата
- `endDate` (string, optional) - Конечная дата
- `page` (number, optional) - Номер страницы
- `limit` (number, optional) - Количество на странице

**Ответ:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "service": "string",
      "metricType": "string",
      "metricName": "string",
      "value": 100,
      "unit": "ms",
      "labels": "object",
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": { ... },
  "metadata": {
    "summary": {
      "totalMetrics": 1000,
      "averageValue": 150.5,
      "minValue": 10,
      "maxValue": 500,
      "lastUpdated": "2024-01-01T00:00:00.000Z"
    },
    "trends": [
      {
        "metric": "response_time",
        "trend": "up",
        "changePercent": 15.5,
        "period": "24h"
      }
    ]
  }
}
```

### Пользовательская аналитика

#### GET /analytics/users/:userId/analytics
Получение аналитики пользователя.

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "userId": "string",
    "totalRequests": 1000,
    "totalTokens": 50000,
    "totalCost": 25.50,
    "averageResponseTime": 150.5,
    "successRate": 0.95,
    "lastActivity": "2024-01-01T00:00:00.000Z",
    "preferences": "object",
    "timezone": "UTC",
    "language": "en"
  },
  "message": "User analytics retrieved successfully"
}
```

### Дашборды

#### GET /analytics/dashboard
Получение данных дашборда.

**Параметры запроса:**
- `userId` (string, optional) - Персонализация для пользователя

**Ответ:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRequests": 10000,
      "totalUsers": 500,
      "totalCost": 1250.75,
      "averageResponseTime": 150.5,
      "successRate": 0.95,
      "uptime": 99.9
    },
    "charts": [
      {
        "id": "usage_over_time",
        "type": "line",
        "title": "Usage Over Time",
        "data": [...],
        "xAxis": "time",
        "yAxis": "requests",
        "timeRange": {
          "start": "2024-01-01T00:00:00.000Z",
          "end": "2024-01-02T00:00:00.000Z",
          "granularity": "hour"
        }
      }
    ],
    "recentActivity": [
      {
        "id": "string",
        "timestamp": "2024-01-01T00:00:00.000Z",
        "type": "user_action",
        "description": "User logged in",
        "userId": "string",
        "metadata": "object"
      }
    ],
    "alerts": [
      {
        "id": "string",
        "alertType": "warning",
        "alertName": "High Error Rate",
        "description": "Error rate exceeded 5%",
        "service": "api-gateway",
        "triggeredAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "recommendations": [
      {
        "id": "string",
        "type": "cost_optimization",
        "title": "Optimize AI Usage",
        "description": "Consider using cheaper models",
        "priority": "medium",
        "actionRequired": true,
        "estimatedImpact": "Save 30% on costs"
      }
    ]
  },
  "message": "Dashboard data retrieved successfully"
}
```

### AI Аналитика

#### GET /analytics/ai/analytics
Получение аналитики ИИ моделей.

**Параметры запроса:**
- `modelId` (string, optional) - Фильтр по модели
- `provider` (string, optional) - Фильтр по провайдеру

**Ответ:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "modelId": "gpt-3.5-turbo",
      "provider": "openai",
      "totalRequests": 1000,
      "totalTokens": 50000,
      "averageLatency": 150.5,
      "successRate": 0.95,
      "averageCost": 0.025,
      "qualityScore": 8.5,
      "lastUpdated": "2024-01-01T00:00:00.000Z"
    }
  ],
  "message": "AI analytics retrieved successfully"
}
```

### Состояние системы

#### GET /analytics/health
Получение состояния системы.

**Ответ:**
```json
{
  "success": true,
  "data": [
    {
      "service": "api-gateway",
      "status": "healthy",
      "responseTime": 50,
      "errorRate": 0.01,
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ],
  "message": "System health retrieved successfully"
}
```

#### GET /analytics/stats/collection
Статистика сбора данных.

**Ответ:**
```json
{
  "success": true,
  "data": {
    "totalEvents": 100000,
    "totalMetrics": 50000,
    "eventsLast24h": 5000,
    "metricsLast24h": 2500,
    "averageEventsPerHour": 208.33,
    "averageMetricsPerHour": 104.17
  },
  "message": "Collection statistics retrieved successfully"
}
```

#### GET /analytics/ping
Проверка работоспособности сервиса.

**Ответ:**
```json
{
  "success": true,
  "data": {
    "service": "analytics-service",
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "version": "1.0.0"
  },
  "message": "Service is healthy"
}
```

---

## 📊 Reports API

### Экспорт данных

#### POST /reports/exports
Создание экспорта данных.

**Тело запроса:**
```json
{
  "exportType": "csv | json | excel | pdf",
  "filters": {
    "dateRange": {
      "start": "2024-01-01T00:00:00.000Z",
      "end": "2024-01-02T00:00:00.000Z"
    },
    "eventTypes": ["user_action", "system_event"],
    "services": ["api-gateway", "auth-service"],
    "userIds": ["user1", "user2"],
    "metrics": ["response_time", "error_rate"]
  },
  "userId": "string (optional)"
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "exportType": "csv",
    "status": "pending",
    "filePath": null,
    "userId": "string",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "completedAt": null,
    "expiresAt": "2024-01-08T00:00:00.000Z"
  },
  "message": "Export created successfully"
}
```

#### GET /reports/exports/:exportId/status
Статус экспорта.

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "exportType": "csv",
    "status": "completed",
    "filePath": "exports/export_123.csv",
    "userId": "string",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "completedAt": "2024-01-01T00:05:00.000Z",
    "expiresAt": "2024-01-08T00:00:00.000Z"
  },
  "message": "Export status retrieved successfully"
}
```

#### GET /reports/exports/:exportId/download
Скачивание файла экспорта.

**Ответ:** Бинарный файл с соответствующими заголовками.

### Отчеты

#### GET /reports/usage/:userId
Отчет по использованию пользователя.

**Параметры запроса:**
- `startDate` (string, required) - Начальная дата
- `endDate` (string, required) - Конечная дата
- `format` (string, optional) - Формат отчета (json/csv/excel)

**Ответ:**
```json
{
  "success": true,
  "data": {
    "userId": "string",
    "timeRange": {
      "start": "2024-01-01T00:00:00.000Z",
      "end": "2024-01-02T00:00:00.000Z"
    },
    "generatedAt": "2024-01-01T00:00:00.000Z",
    "summary": {
      "totalEvents": 1000,
      "totalMetrics": 500,
      "totalRequests": 1000,
      "totalTokens": 50000,
      "totalCost": 25.50,
      "averageResponseTime": 150.5,
      "successRate": 0.95
    },
    "events": [...],
    "metrics": [...]
  },
  "message": "Usage report generated successfully"
}
```

#### GET /reports/system-health
Отчет по состоянию системы.

**Параметры запроса:**
- `startDate` (string, required) - Начальная дата
- `endDate` (string, required) - Конечная дата

**Ответ:**
```json
{
  "success": true,
  "data": {
    "timeRange": { ... },
    "generatedAt": "2024-01-01T00:00:00.000Z",
    "summary": {
      "totalServices": 5,
      "averageUptime": 99.5,
      "totalErrors": 10,
      "totalMetrics": 1000
    },
    "serviceStats": [
      {
        "service": "api-gateway",
        "uptime": 99.9,
        "averageResponseTime": 50,
        "averageErrorRate": 0.01,
        "totalChecks": 1000
      }
    ],
    "errors": [...],
    "metrics": [...]
  },
  "message": "System health report generated successfully"
}
```

#### GET /reports/ai-analytics
Отчет по аналитике ИИ.

**Параметры запроса:**
- `startDate` (string, required) - Начальная дата
- `endDate` (string, required) - Конечная дата

**Ответ:**
```json
{
  "success": true,
  "data": {
    "timeRange": { ... },
    "generatedAt": "2024-01-01T00:00:00.000Z",
    "summary": {
      "totalModels": 10,
      "totalClassifications": 5000,
      "totalCertifications": 1000,
      "totalSafetyAssessments": 2000
    },
    "modelPerformance": [...],
    "classificationStats": [...],
    "certificationStats": [...],
    "safetyStats": [...]
  },
  "message": "AI analytics report generated successfully"
}
```

### Графики

#### GET /reports/charts/:chartType
Генерация данных для графиков.

**Параметры:**
- `chartType` - Тип графика (line/bar/pie/area/scatter)
- `startDate` (string, required) - Начальная дата
- `endDate` (string, required) - Конечная дата
- `granularity` (string, optional) - Гранулярность времени

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": "chart_123",
    "type": "line",
    "title": "Usage Over Time",
    "data": [
      {
        "x": "2024-01-01T00:00:00.000Z",
        "y": 100,
        "label": "requests"
      }
    ],
    "xAxis": "timestamp",
    "yAxis": "value",
    "timeRange": { ... }
  },
  "message": "Chart data generated successfully"
}
```

### Обслуживание

#### POST /reports/cleanup
Очистка просроченных экспортов.

**Ответ:**
```json
{
  "success": true,
  "data": {
    "cleanedCount": 10
  },
  "message": "Cleanup completed successfully. Removed 10 expired exports."
}
```

---

## Коды ошибок

| Код | Описание |
|-----|----------|
| 400 | Неверный запрос |
| 401 | Не авторизован |
| 403 | Доступ запрещен |
| 404 | Не найдено |
| 422 | Ошибка валидации |
| 429 | Превышен лимит запросов |
| 500 | Внутренняя ошибка сервера |
| 503 | Сервис недоступен |

---

## Ограничения

- Максимум 100 событий в пакетном запросе
- Максимум 100 метрик в пакетном запросе
- Лимит 100 запросов в минуту на IP
- Экспорты хранятся 7 дней
- Максимальный размер экспорта: 100MB

---

## Примеры использования

### JavaScript/Node.js
```javascript
const axios = require('axios');

// Отслеживание события
await axios.post('http://localhost:3005/analytics/events/track', {
  eventType: 'user_action',
  eventName: 'login',
  service: 'auth-service',
  userId: 'user123',
  properties: { method: 'email' }
});

// Получение дашборда
const dashboard = await axios.get('http://localhost:3005/analytics/dashboard');
```

### Python
```python
import requests

# Запись метрики
requests.post('http://localhost:3005/analytics/metrics/record', json={
  'service': 'api-gateway',
  'metricType': 'performance',
  'metricName': 'response_time',
  'value': 150,
  'unit': 'ms',
  'labels': {'endpoint': '/api/chat'}
})

# Создание экспорта
export_response = requests.post('http://localhost:3005/reports/exports', json={
  'exportType': 'csv',
  'filters': {
    'dateRange': {
      'start': '2024-01-01T00:00:00.000Z',
      'end': '2024-01-02T00:00:00.000Z'
    }
  }
})
```

### cURL
```bash
# Health check
curl http://localhost:3005/analytics/ping

# Получение событий
curl "http://localhost:3005/analytics/events?page=1&limit=10&eventTypes=user_action"

# Создание экспорта
curl -X POST http://localhost:3005/reports/exports \
  -H "Content-Type: application/json" \
  -d '{"exportType":"json","filters":{"dateRange":{"start":"2024-01-01T00:00:00.000Z","end":"2024-01-02T00:00:00.000Z"}}}'
```
