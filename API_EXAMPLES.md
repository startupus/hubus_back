# Примеры использования API

## Базовые параметры

- **Base URL**: `http://localhost:3000/api/v1`
- **API Key**: `ak_f8102e585cef62a1c4b990cfd1c55d3ccec91dcc2982fdfdc5b0e350699cc847`
- **Формат API Key**: `Bearer ak_[A-Za-z0-9]{40}` или `Bearer ak_[a-f0-9]{64}`

---

## 1. Получение списка моделей

### cURL
```bash
curl -X GET "http://localhost:3000/api/v1/models" \
  -H "Authorization: Bearer ak_f8102e585cef62a1c4b990cfd1c55d3ccec91dcc2982fdfdc5b0e350699cc847"
```

### PowerShell
```powershell
$headers = @{
    "Authorization" = "Bearer ak_f8102e585cef62a1c4b990cfd1c55d3ccec91dcc2982fdfdc5b0e350699cc847"
}

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/models" -Method GET -Headers $headers
$response | ConvertTo-Json -Depth 5
```

### JavaScript/TypeScript (fetch)
```javascript
const apiKey = 'ak_f8102e585cef62a1c4b990cfd1c55d3ccec91dcc2982fdfdc5b0e350699cc847';

const response = await fetch('http://localhost:3000/api/v1/models', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${apiKey}`
  }
});

const data = await response.json();
console.log(data);
```

### Python (requests)
```python
import requests

api_key = 'ak_f8102e585cef62a1c4b990cfd1c55d3ccec91dcc2982fdfdc5b0e350699cc847'

response = requests.get(
    'http://localhost:3000/api/v1/models',
    headers={
        'Authorization': f'Bearer {api_key}'
    }
)

print(response.json())
```

### Пример ответа
```json
{
  "data": [
    {
      "id": "openai/gpt-3.5-turbo",
      "name": "GPT-3.5 Turbo",
      "context_length": 16385,
      "pricing": {
        "prompt": "0.0000005",
        "completion": "0.0000015"
      }
    },
    {
      "id": "openai/gpt-4",
      "name": "GPT-4",
      "context_length": 8192,
      "pricing": {
        "prompt": "0.00003",
        "completion": "0.00006"
      }
    }
    // ... еще модели
  ]
}
```

---

## 2. Отправка запроса к нейросети (Chat Completions)

### cURL
```bash
curl -X POST "http://localhost:3000/api/v1/chat/completions" \
  -H "Authorization: Bearer ak_f8102e585cef62a1c4b990cfd1c55d3ccec91dcc2982fdfdc5b0e350699cc847" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-3.5-turbo",
    "messages": [
      {
        "role": "user",
        "content": "Привет! Как дела?"
      }
    ],
    "temperature": 0.7,
    "max_tokens": 500
  }'
```

### PowerShell
```powershell
$headers = @{
    "Authorization" = "Bearer ak_f8102e585cef62a1c4b990cfd1c55d3ccec91dcc2982fdfdc5b0e350699cc847"
    "Content-Type" = "application/json"
}

$body = @{
    model = "openai/gpt-3.5-turbo"
    messages = @(
        @{
            role = "user"
            content = "Привет! Как дела?"
        }
    )
    temperature = 0.7
    max_tokens = 500
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/chat/completions" -Method POST -Headers $headers -Body $body
$response | ConvertTo-Json -Depth 10
```

### JavaScript/TypeScript (fetch)
```javascript
const apiKey = 'ak_f8102e585cef62a1c4b990cfd1c55d3ccec91dcc2982fdfdc5b0e350699cc847';

const response = await fetch('http://localhost:3000/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'openai/gpt-3.5-turbo',
    messages: [
      {
        role: 'user',
        content: 'Привет! Как дела?'
      }
    ],
    temperature: 0.7,
    max_tokens: 500
  })
});

const data = await response.json();
console.log(data);
```

### Python (requests)
```python
import requests
import json

api_key = 'ak_f8102e585cef62a1c4b990cfd1c55d3ccec91dcc2982fdfdc5b0e350699cc847'

response = requests.post(
    'http://localhost:3000/api/v1/chat/completions',
    headers={
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    },
    json={
        'model': 'openai/gpt-3.5-turbo',
        'messages': [
            {
                'role': 'user',
                'content': 'Привет! Как дела?'
            }
        ],
        'temperature': 0.7,
        'max_tokens': 500
    }
)

print(json.dumps(response.json(), indent=2, ensure_ascii=False))
```

### Пример ответа
```json
{
  "id": "gen-1767451458-5AXyC7UxxZiJP9xXCiwc",
  "provider": "openrouter",
  "model": "openai/gpt-3.5-turbo",
  "object": "chat.completion",
  "created": 1767451458,
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Привет! У меня всё отлично, спасибо! Я готов помочь вам с любыми вопросами. Как дела у вас?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 13,
    "completion_tokens": 31,
    "total_tokens": 44,
    "cost": 0.000053
  },
  "processing_time_ms": 1191
}
```

---

## 3. Примеры различных типов запросов

### Диалог с несколькими сообщениями
```json
{
  "model": "openai/gpt-3.5-turbo",
  "messages": [
    {
      "role": "system",
      "content": "Ты полезный ассистент, который отвечает на русском языке."
    },
    {
      "role": "user",
      "content": "Что такое искусственный интеллект?"
    },
    {
      "role": "assistant",
      "content": "Искусственный интеллект (ИИ) - это область компьютерных наук..."
    },
    {
      "role": "user",
      "content": "Расскажи подробнее о машинном обучении"
    }
  ],
  "temperature": 0.8,
  "max_tokens": 1000
}
```

### Запрос с настройками генерации
```json
{
  "model": "openai/gpt-4",
  "messages": [
    {
      "role": "user",
      "content": "Напиши короткий рассказ о космосе"
    }
  ],
  "temperature": 0.9,
  "max_tokens": 500,
  "top_p": 0.95,
  "frequency_penalty": 0.5,
  "presence_penalty": 0.3
}
```

### Запрос на английском языке
```json
{
  "model": "openai/gpt-3.5-turbo",
  "messages": [
    {
      "role": "user",
      "content": "Hello! Can you explain what machine learning is?"
    }
  ],
  "temperature": 0.7
}
```

---

## 4. Параметры запроса

### Обязательные параметры
- `model` (string) - ID модели (например, `"openai/gpt-3.5-turbo"`)
- `messages` (array) - Массив сообщений, минимум одно сообщение

### Опциональные параметры
- `temperature` (number, 0-2) - Температура генерации (по умолчанию: 1.0)
- `max_tokens` (number) - Максимальное количество токенов в ответе
- `top_p` (number, 0-1) - Параметр top_p для ядерной выборки
- `frequency_penalty` (number, -2.0 до 2.0) - Штраф за частоту
- `presence_penalty` (number, -2.0 до 2.0) - Штраф за присутствие

### Формат сообщений
```json
{
  "role": "user" | "assistant" | "system",
  "content": "Текст сообщения"
}
```

---

## 5. Обработка ошибок

### Неверный API ключ (401)
```json
{
  "statusCode": 401,
  "message": "Invalid or expired API key"
}
```

### Неверный формат запроса (400)
```json
{
  "statusCode": 400,
  "message": "Model is required"
}
```

### Недостаточно средств (402)
```json
{
  "statusCode": 402,
  "message": "Insufficient balance"
}
```

---

## 6. Полный пример на JavaScript

```javascript
class AIAggregatorClient {
  constructor(apiKey, baseUrl = 'http://localhost:3000/api/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async getModels() {
    const response = await fetch(`${this.baseUrl}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async chatCompletion(model, messages, options = {}) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        ...options
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }
}

// Использование
const client = new AIAggregatorClient('ak_f8102e585cef62a1c4b990cfd1c55d3ccec91dcc2982fdfdc5b0e350699cc847');

// Получить список моделей
const models = await client.getModels();
console.log('Доступно моделей:', models.data.length);

// Отправить запрос
const response = await client.chatCompletion(
  'openai/gpt-3.5-turbo',
  [
    { role: 'user', content: 'Привет!' }
  ],
  { temperature: 0.7, max_tokens: 500 }
);

console.log('Ответ:', response.choices[0].message.content);
```

---

## 7. Полный пример на Python

```python
import requests
from typing import List, Dict, Optional

class AIAggregatorClient:
    def __init__(self, api_key: str, base_url: str = 'http://localhost:3000/api/v1'):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {api_key}'
        }

    def get_models(self) -> Dict:
        """Получить список доступных моделей"""
        response = requests.get(
            f'{self.base_url}/models',
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

    def chat_completion(
        self,
        model: str,
        messages: List[Dict],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> Dict:
        """Отправить запрос к нейросети"""
        payload = {
            'model': model,
            'messages': messages
        }
        
        if temperature is not None:
            payload['temperature'] = temperature
        if max_tokens is not None:
            payload['max_tokens'] = max_tokens
        payload.update(kwargs)

        headers = {**self.headers, 'Content-Type': 'application/json'}
        response = requests.post(
            f'{self.base_url}/chat/completions',
            headers=headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()

# Использование
client = AIAggregatorClient('ak_f8102e585cef62a1c4b990cfd1c55d3ccec91dcc2982fdfdc5b0e350699cc847')

# Получить список моделей
models = client.get_models()
print(f'Доступно моделей: {len(models["data"])}')

# Отправить запрос
response = client.chat_completion(
    model='openai/gpt-3.5-turbo',
    messages=[
        {'role': 'user', 'content': 'Привет!'}
    ],
    temperature=0.7,
    max_tokens=500
)

print(f'Ответ: {response["choices"][0]["message"]["content"]}')
```

---

## Примечания

1. **API Key** должен быть в формате `Bearer ak_...` в заголовке `Authorization`
2. **Base URL** может отличаться в зависимости от окружения (production, staging)
3. **Модели** доступны через `/api/v1/models` - используйте точный ID модели из списка
4. **Баланс** списывается автоматически после успешного запроса
5. **Rate Limiting** может применяться при большом количестве запросов


